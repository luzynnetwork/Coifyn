import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CustomerPreferencesRepo } from '../data/customer-preferences.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { requireCustomer } from './require-customer.js';

@Injectable()
export class GetPreferences {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly preferences: CustomerPreferencesRepo,
  ) {}

  execute(user: AuthUser, customerId: string) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'customer:view', { salonId });
      await requireCustomer(this.customers, salonId, customerId);
      return (
        (await this.preferences.find(salonId, customerId)) ?? {
          customerId,
          preferredStylistId: null,
          preferredChairId: null,
          drink: null,
          conversationLevel: null,
          communicationChannel: null,
        }
      );
    });
  }
}
