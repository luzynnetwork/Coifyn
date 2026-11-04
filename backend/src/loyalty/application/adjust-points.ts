import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { LoyaltyAccountsRepo } from '../data/loyalty-accounts.repo.js';
import type { AdjustPointsDto } from '../dto/loyalty.dto.js';
import { PointsPoster } from './points-poster.js';

/** Manual correction — permission-gated (`loyalty:adjust`), reason required,
 *  audited. The balance can never be driven below zero. */
@Injectable()
export class AdjustPoints {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly accounts: LoyaltyAccountsRepo,
    private readonly poster: PointsPoster,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, customerId: string, dto: AdjustPointsDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'loyalty:adjust', { salonId });
      if (!(await this.customers.findById(salonId, customerId))) {
        throw new NotFoundException('Customer not found.');
      }
      const current = (await this.accounts.find(salonId, customerId))?.pointsBalance ?? 0;
      if (current + dto.delta < 0) {
        throw new BadRequestException(`Balance is ${current}; cannot remove ${-dto.delta}.`);
      }

      const account = await this.poster.post({
        salonId,
        customerId,
        kind: 'adjust',
        delta: dto.delta,
        source: 'manual',
        reason: dto.reason,
        createdBy: user.id,
      });
      await this.events.emit({
        aggregateType: 'loyalty_account',
        aggregateId: account.id,
        type: 'LoyaltyPointsAdjusted',
        salonId,
        payload: { customerId, delta: dto.delta },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'loyalty.adjusted',
        targetType: 'customer',
        targetId: customerId,
        reason: dto.reason,
        before: { pointsBalance: current },
        after: { pointsBalance: account.pointsBalance },
      });
      return account;
    });
  }
}
