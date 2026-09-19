import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';

@Injectable()
export class GetAppointment {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly appointments: AppointmentsRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const appt = await this.appointments.findById(salonId, id);
      if (!appt) throw new NotFoundException('Appointment not found.');
      await this.authorize.check(user, 'appointment:view', {
        salonId,
        branchId: appt.branchId,
      });
      return appt;
    });
  }
}
