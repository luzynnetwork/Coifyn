import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { CustomerTagsRepo } from '../data/customer-tags.repo.js';
import { CustomerTimelineRepo } from '../data/customer-timeline.repo.js';
import { CustomersRepo } from '../data/customers.repo.js';
import { requireCustomer } from './require-customer.js';

/** Visits, appointments, no-shows, notes and (with `cutrecord:view`) cut
 *  records, newest first, plus the customer's tags. */
@Injectable()
export class GetTimeline {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly customers: CustomersRepo,
    private readonly timeline: CustomerTimelineRepo,
    private readonly tags: CustomerTagsRepo,
  ) {}

  execute(user: AuthUser, customerId: string) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'customer:view', { salonId });
      const customer = await requireCustomer(this.customers, salonId, customerId);
      const includeCutRecords = await this.authorize.can(
        user,
        'cutrecord:view',
        { salonId },
      );
      return {
        customer,
        tags: (await this.tags.list(salonId, customerId)).map((t) => t.tag),
        items: await this.timeline.build(salonId, customerId, {
          includeCutRecords,
        }),
      };
    });
  }
}
