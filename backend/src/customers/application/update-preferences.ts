import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CustomerPreferencesRepo } from '../data/customer-preferences.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import type { UpdatePreferencesDto } from '../dto/customer-crm.dto.js';
import { requireCustomer } from './require-customer.js';

@Injectable()
export class UpdatePreferences {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly preferences: CustomerPreferencesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, customerId: string, dto: UpdatePreferencesDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'customer:manage', { salonId });
      await requireCustomer(this.customers, salonId, customerId);

      const row = await this.preferences.upsert(salonId, customerId, { ...dto });
      await this.events.emit({
        aggregateType: 'customer',
        aggregateId: customerId,
        type: 'CustomerPreferencesUpdated',
        salonId,
        payload: { customerId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'customer.preferences_updated',
        targetType: 'customer',
        targetId: customerId,
        after: dto,
      });
      return row;
    });
  }
}
