import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CustomerNotesRepo } from '../data/customer-notes.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import type { AddNoteDto } from '../dto/customer-crm.dto.js';
import { requireCustomer } from './require-customer.js';

@Injectable()
export class AddNote {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly notes: CustomerNotesRepo,
  ) {}

  execute(user: AuthUser, customerId: string, dto: AddNoteDto) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'customer:manage', { salonId });
      await requireCustomer(this.customers, salonId, customerId);
      return this.notes.add({
        salonId,
        customerId,
        authorId: user.id,
        body: dto.body,
      });
    });
  }
}
