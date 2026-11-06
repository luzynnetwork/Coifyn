import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CustomerMergeRepo } from '../data/customer-merge.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import type { MergeCustomersDto } from '../dto/customer-crm.dto.js';
import { requireCustomer } from './require-customer.js';

/** Duplicate resolution: folds `mergedId` into `survivorId`. Audited with a reason. */
@Injectable()
export class MergeCustomers {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly merger: CustomerMergeRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, dto: MergeCustomersDto) {
    if (dto.survivorId === dto.mergedId) {
      throw new BadRequestException('Cannot merge a customer into itself.');
    }
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'customer:manage', { salonId });
      const merged = await requireCustomer(this.customers, salonId, dto.mergedId);
      await requireCustomer(this.customers, salonId, dto.survivorId);

      await this.merger.merge(salonId, dto.survivorId, dto.mergedId);

      await this.events.emit({
        aggregateType: 'customer',
        aggregateId: dto.survivorId,
        type: 'CustomersMerged',
        salonId,
        payload: { survivorId: dto.survivorId, mergedId: dto.mergedId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'customer.merged',
        targetType: 'customer',
        targetId: dto.survivorId,
        reason: dto.reason,
        before: { mergedId: merged.id, mergedName: merged.name },
      });
      return this.customers.findById(salonId, dto.survivorId);
    });
  }
}
