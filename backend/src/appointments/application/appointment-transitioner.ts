import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { formatLocal } from '../../common/day-bounds.js';
import { EventBus } from '../../events/event-bus.js';
import type { EventType } from '../../events/event-registry.js';
import { DispatchNotification } from '../../notifications/application/dispatch-notification.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import {
  StylistPresence,
  type PresenceChange,
} from '../../stylists/application/stylist-presence.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
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
 *  check the transition is legal, update, emit, audit, publish. Starting a
 *  service marks the stylist `busy`; completing it frees them (`available`);
 *  cancelling tells the customer. */
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
    private readonly presence: StylistPresence,
    private readonly stylists: StylistProfilesRepo,
    private readonly salons: SalonsRepo,
    private readonly notifications: DispatchNotification,
  ) {}

  async execute(user: AuthUser, id: string, t: AppointmentTransition) {
    const salonId = await this.salon.execute(user);
    let presenceChange: PresenceChange | null = null;
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

        if (t.to === 'in_service') {
          presenceChange = await this.presence.set(
            salonId,
            appt.stylistId,
            'busy',
            user.id,
            'service started',
          );
        } else if (t.to === 'completed') {
          const stylist = await this.stylists.findById(salonId, appt.stylistId);
          if (stylist?.status === 'busy') {
            presenceChange = await this.presence.set(
              salonId,
              appt.stylistId,
              'available',
              user.id,
              'service completed',
            );
          }
        } else if (t.to === 'cancelled' && appt.customerId) {
          const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
          await this.notifications.execute({
            salonId,
            key: 'appointment.cancelled',
            customerId: appt.customerId,
            dedupeKey: `appointment.cancelled:${id}`,
            data: { startAt: formatLocal(appt.startAt, tz) },
          });
        }
        return row ?? appt;
      },
    );

    this.presence.announce(presenceChange);
    this.realtime.publish(`bookings:${updated.stylistId}`, {
      appointmentId: id,
      status: updated.status,
    });
    this.realtime.publish(`front-desk:${updated.branchId}`, {
      appointmentId: id,
    });
    return updated;
  }
}
