import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentTransitioner } from './appointment-transitioner.js';

@Injectable()
export class CancelAppointment {
  constructor(private readonly transitioner: AppointmentTransitioner) {}

  execute(user: AuthUser, id: string) {
    return this.transitioner.execute(user, id, {
      from: ['booked', 'arrived'],
      to: 'cancelled',
      eventType: 'AppointmentCancelled',
      action: 'appointment.cancelled',
    });
  }
}
