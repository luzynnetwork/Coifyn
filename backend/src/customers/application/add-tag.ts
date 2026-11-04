import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CustomerTagsRepo } from '../data/customer-tags.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import type { AddTagDto } from '../dto/customer-crm.dto.js';
import { requireCustomer } from './require-customer.js';

@Injectable()
export class AddTag {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly tags: CustomerTagsRepo,
  ) {}

  execute(user: AuthUser, customerId: string, dto: AddTagDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'customer:manage', { salonId });
      await requireCustomer(this.customers, salonId, customerId);
      return this.tags.add(salonId, customerId, dto.tag.trim().toLowerCase());
    });
  }
}
