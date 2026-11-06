import { Injectable } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { LoyaltyAccountsRepo } from '../data/loyalty-accounts.repo.js';
import { LoyaltyLedgerRepo, type LedgerKind } from '../data/loyalty-ledger.repo.js';
import { LoyaltyRulesRepo } from '../data/loyalty-rules.repo.js';
import { tierFor } from '../domain/points.js';

/** The single write path for points: one immutable ledger row, the balance
 *  change and tier recompute, in the caller's transaction. */
@Injectable()
export class PointsPoster {
  constructor(
    private readonly rules: LoyaltyRulesRepo,
    private readonly accounts: LoyaltyAccountsRepo,
    private readonly ledger: LoyaltyLedgerRepo,
    private readonly events: EventBus,
  ) {}

  async post(input: {
    salonId: string;
    customerId: string;
    kind: LedgerKind;
    delta: number;
    source: string;
    sourceId?: string | null;
    reason?: string | null;
    createdBy?: string | null;
  }) {
    const before = await this.accounts.findOrCreate(input.salonId, input.customerId);
    await this.ledger.append(input);
    let account = await this.accounts.addPoints(
      input.salonId,
      input.customerId,
      input.delta,
    );

    const { tiers } = await this.rules.effective(input.salonId);
    const tier = tierFor(account.pointsBalance, tiers);
    if (tier !== before.tier) {
      await this.accounts.setTier(input.salonId, input.customerId, tier);
      account = { ...account, tier };
      if (tier) {
        await this.events.emit({
          aggregateType: 'loyalty_account',
          aggregateId: account.id,
          type: 'LoyaltyTierChanged',
          salonId: input.salonId,
          payload: { customerId: input.customerId, tier },
        });
      }
    }
    return account;
  }
}
