import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { CustomersRepo } from '../data/customers.repo.js';

/**
 * Phase 1 has no visit-history table: a visit is only the counters recorded on
 * payment. Real visit history (cut records, timeline) lands in Phase 2, so this
 * returns an empty list for a valid customer.
 */
@Injectable()
export class ListCustomerVisits {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'customer:view', { salonId });
      const customer = await this.customers.findById(salonId, id);
      if (!customer) throw new NotFoundException('Customer not found.');
      return [];
    });
  }
}
