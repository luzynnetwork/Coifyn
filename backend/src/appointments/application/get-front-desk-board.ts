import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';

const lane = (status: string) =>
  status === 'booked'
    ? 'upcoming'
    : status === 'arrived'
      ? 'arrived'
      : status === 'in_service'
        ? 'inService'
        : 'done';

/** Every stylist in the branch with their live status and the day's bookings
 *  grouped into upcoming / arrived / in service / done. */
@Injectable()
export class GetFrontDeskBoard {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly salons: SalonsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly customers: CustomersRepo,
  ) {}

  execute(user: AuthUser, branchId: string, date: string) {
    return this.scope.run(user, async (salonId) => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'appointment:view', { salonId, branchId });

      const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      const { from, to } = dayBoundsUtc(date, tz);
      const [stylists, appts] = await Promise.all([
        this.stylists.listForSalon(salonId),
        this.appointments.listBetween(salonId, branchId, from, to),
      ]);

      const names = new Map<string, string>();
      for (const id of new Set(appts.map((a) => a.customerId).filter(Boolean))) {
        const c = await this.customers.findById(salonId, id as string);
        if (c) names.set(c.id, c.name);
      }

      return {
        date,
        stylists: stylists
          .filter((s) => s.branchId === branchId)
          .map((s) => {
            const mine = appts.filter((a) => a.stylistId === s.id);
            const lanes = { upcoming: [], arrived: [], inService: [], done: [] } as Record<
              string,
              unknown[]
            >;
            for (const a of mine) {
              lanes[lane(a.status)].push({
                ...a,
                customerName: a.customerId ? (names.get(a.customerId) ?? null) : null,
              });
            }
            return {
              id: s.id,
              displayName: s.displayName,
              status: s.status,
              ...lanes,
            };
          }),
      };
    });
  }
}
