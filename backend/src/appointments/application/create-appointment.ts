import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import type { CreateAppointmentDto } from '../dto/appointment.dto.js';
import { AppointmentBooker } from './appointment-booker.js';

/** Staff-entered booking. The rules live in {@link AppointmentBooker}. */
@Injectable()
export class CreateAppointment {
  constructor(
    private readonly scope: TenantScope,
    private readonly booker: AppointmentBooker,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, dto: CreateAppointmentDto) {
    const created = await this.scope.run(user, (salonId) =>
      this.booker.book(user, salonId, dto),
    );
    this.realtime.publish(`bookings:${created.stylistId}`, {
      appointmentId: created.id,
      status: created.status,
    });
    this.realtime.publish(`front-desk:${created.branchId}`, {
      appointmentId: created.id,
    });
    return created;
  }
}
