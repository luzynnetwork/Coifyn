import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';

/** A branch's appointments for one local calendar day in the salon's timezone. */
@Injectable()
export class ListAppointments {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
    private readonly branches: BranchesRepo,
    private readonly appointments: AppointmentsRepo,
  ) {}

  async execute(user: AuthUser, branchId: string, date: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'appointment:view', {
        salonId,
        branchId,
      });

      const salon = await this.salons.findById(salonId);
      const { from, to } = dayBoundsUtc(date, salon?.timezone ?? 'UTC');
      return this.appointments.listBetween(salonId, branchId, from, to);
    });
  }
}
