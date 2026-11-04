import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import type { EventType } from '../../events/event-registry.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import {
  AppointmentsRepo,
  type AppointmentStatus,
} from '../data/appointments.repo.js';

export interface AppointmentTransition {
  from: AppointmentStatus[];
  to: AppointmentStatus;
  eventType: Extract<
    EventType,
    | 'AppointmentArrived'
    | 'AppointmentStarted'
    | 'AppointmentCompleted'
    | 'AppointmentNoShow'
    | 'AppointmentCancelled'
  >;
  action: string;
}

/** The one place an appointment's status changes: authorize (branch-scoped),
 *  check the transition is legal, update, emit, audit, publish. */
@Injectable()
export class AppointmentTransitioner {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly appointments: AppointmentsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string, t: AppointmentTransition) {
    const salonId = await this.salon.execute(user);
    const updated = await this.database.withTenant(
      user.id,
      salonId,
      async () => {
        const appt = await this.appointments.findById(salonId, id);
        if (!appt) throw new NotFoundException('Appointment not found.');

        await this.authorize.check(user, 'appointment:manage', {
          salonId,
          branchId: appt.branchId,
        });
        if (!t.from.includes(appt.status as AppointmentStatus)) {
          throw new ConflictException(
            `Cannot move a "${appt.status}" appointment to "${t.to}".`,
          );
        }

        const row = await this.appointments.update(salonId, id, {
          status: t.to,
        });
        await this.events.emit({
          aggregateType: 'appointment',
          aggregateId: id,
          type: t.eventType,
          salonId,
          payload: {
            appointmentId: id,
            branchId: appt.branchId,
            stylistId: appt.stylistId,
          },
        });
        await this.audit.write({
          salonId,
          actor: user,
          action: t.action,
          targetType: 'appointment',
          targetId: id,
          before: { status: appt.status },
          after: { status: t.to },
        });
        return row ?? appt;
      },
    );

    this.realtime.publish(`bookings:${updated.stylistId}`, {
      appointmentId: id,
      status: updated.status,
    });
    return updated;
  }
}
