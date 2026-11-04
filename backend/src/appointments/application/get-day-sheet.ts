import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';

/** A stylist's own list for one local day, with each customer's name/phone. */
@Injectable()
export class GetDaySheet {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly salons: SalonsRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly customers: CustomersRepo,
  ) {}

  execute(user: AuthUser, stylistId: string, date: string) {
    return this.scope.run(user, async (salonId) => {
      const stylist = await this.stylists.findById(salonId, stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      await this.authorize.check(user, 'appointment:view', {
        salonId,
        branchId: stylist.branchId,
      });

      const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      const { from, to } = dayBoundsUtc(date, tz);
      const rows = (
        await this.appointments.listBetween(salonId, stylist.branchId, from, to)
      ).filter((a) => a.stylistId === stylistId || a.originalStylistId === stylistId);

      const items = [];
      for (const a of rows) {
        const customer = a.customerId
          ? await this.customers.findById(salonId, a.customerId)
          : undefined;
        items.push({
          ...a,
          customer: customer
            ? { id: customer.id, name: customer.name, phone: customer.phone }
            : null,
        });
      }
      return { stylist: { id: stylist.id, displayName: stylist.displayName }, items };
    });
  }
}
