import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentTransitioner } from './appointment-transitioner.js';

@Injectable()
export class CompleteAppointment {
  constructor(private readonly transitioner: AppointmentTransitioner) {}

  execute(user: AuthUser, id: string) {
    return this.transitioner.execute(user, id, {
      from: ['in_service'],
      to: 'completed',
      eventType: 'AppointmentCompleted',
      action: 'appointment.completed',
    });
  }
}
