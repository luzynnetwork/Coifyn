import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { DisruptionsRepo } from '../data/disruptions.repo.js';

/** The stylist's active appointments inside the disruption window. */
@Injectable()
export class ListAffected {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly disruptions: DisruptionsRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly customers: CustomersRepo,
  ) {}

  execute(user: AuthUser, disruptionId: string) {
    return this.scope.run(user, async (salonId) => {
      const disruption = await this.disruptions.findById(salonId, disruptionId);
      if (!disruption) throw new NotFoundException('Disruption not found.');
      await this.authorize.check(user, 'disruption:manage', {
        salonId,
        branchId: disruption.branchId,
      });

      const rows = await this.appointments.listActiveForStylist(
        salonId,
        disruption.stylistId,
        disruption.windowStart,
        disruption.windowEnd,
      );
      const out = [];
      for (const a of rows) {
        const c = a.customerId
          ? await this.customers.findById(salonId, a.customerId)
          : undefined;
        out.push({
          ...a,
          customer: c ? { id: c.id, name: c.name, phone: c.phone } : null,
        });
      }
      return out;
    });
  }
}
