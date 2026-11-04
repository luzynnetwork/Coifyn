import { Injectable } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { DispatchNotification } from '../../notifications/application/dispatch-notification.js';
import { LoyaltyLedgerRepo } from '../data/loyalty-ledger.repo.js';
import { LoyaltyRulesRepo } from '../data/loyalty-rules.repo.js';
import { pointsForSpend } from '../domain/points.js';
import { PointsPoster } from './points-poster.js';

/**
 * `loyalty-accrual`: points for a settled payment, against the salon's rule.
 * Called by the payment use case inside the payment transaction, so a sale and
 * its points commit (or fail) together. Idempotent per payment — the ledger has
 * a unique (kind, source id) index and we check it first.
 */
@Injectable()
export class AccruePoints {
  constructor(
    private readonly rules: LoyaltyRulesRepo,
    private readonly ledger: LoyaltyLedgerRepo,
    private readonly poster: PointsPoster,
    private readonly notifications: DispatchNotification,
    private readonly events: EventBus,
  ) {}

  async forPayment(input: {
    salonId: string;
    customerId: string;
    paymentId: string;
    totalMinor: number;
  }): Promise<number> {
    if (await this.ledger.hasEntry('earn', input.paymentId)) return 0;

    const { pointsPerUnit } = await this.rules.effective(input.salonId);
    const points = pointsForSpend(input.totalMinor, pointsPerUnit);
    if (points <= 0) return 0;

    const account = await this.poster.post({
      salonId: input.salonId,
      customerId: input.customerId,
      kind: 'earn',
      delta: points,
      source: 'payment',
      sourceId: input.paymentId,
    });
    await this.events.emit({
      aggregateType: 'loyalty_account',
      aggregateId: account.id,
      type: 'LoyaltyPointsEarned',
      salonId: input.salonId,
      payload: { customerId: input.customerId, points },
    });
    await this.notifications.execute({
      salonId: input.salonId,
      key: 'loyalty.points_earned',
      customerId: input.customerId,
      dedupeKey: `loyalty.points_earned:${input.paymentId}`,
      data: { points, balance: account.pointsBalance },
    });
    return points;
  }
}
