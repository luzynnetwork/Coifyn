import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { formatLocal } from '../../common/day-bounds.js';
import { EventBus } from '../../events/event-bus.js';
import { DispatchNotification } from '../../notifications/application/dispatch-notification.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import {
  ACTIVE_STATUSES,
  AppointmentsRepo,
  type AppointmentStatus,
} from '../data/appointments.repo.js';
import { AppointmentReschedulesRepo } from '../data/appointment-reschedules.repo.js';
import type { RescheduleDto } from '../dto/appointment-phase2.dto.js';
import { AppointmentConflictGuard } from './appointment-conflict-guard.js';

/** Moves a booking to a new time (same stylist), keeping the move history and
 *  telling the customer. */
@Injectable()
export class RescheduleAppointment {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly appointments: AppointmentsRepo,
    private readonly reschedules: AppointmentReschedulesRepo,
    private readonly conflicts: AppointmentConflictGuard,
    private readonly stylists: StylistProfilesRepo,
    private readonly salons: SalonsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly notifications: DispatchNotification,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string, dto: RescheduleDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (!(startAt < endAt)) {
      throw new BadRequestException('endAt must be after startAt.');
    }

    const updated = await this.scope.run(user, async (salonId) => {
      const before = await this.appointments.findById(salonId, id);
      if (!before) throw new NotFoundException('Appointment not found.');
      await this.authorize.check(user, 'appointment:manage', {
        salonId,
        branchId: before.branchId,
      });
      if (!ACTIVE_STATUSES.includes(before.status as AppointmentStatus)) {
        throw new ConflictException(`A ${before.status} appointment cannot be moved.`);
      }

      const { overriddenConflictId } = await this.conflicts.assertFree(user, {
        salonId,
        branchId: before.branchId,
        stylistId: before.stylistId,
        chairId: before.chairId,
        startAt,
        endAt,
        excludeId: id,
        overrideReason: dto.overrideReason,
      });

      const row =
        (await this.appointments.update(salonId, id, { startAt, endAt })) ?? before;
      await this.reschedules.append({
        salonId,
        appointmentId: id,
        fromStartAt: before.startAt,
        fromEndAt: before.endAt,
        toStartAt: startAt,
        toEndAt: endAt,
        rescheduledBy: user.id,
        reason: dto.reason ?? null,
      });
      await this.events.emit({
        aggregateType: 'appointment',
        aggregateId: id,
        type: 'AppointmentRescheduled',
        salonId,
        payload: { appointmentId: id, branchId: row.branchId, stylistId: row.stylistId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: overriddenConflictId
          ? 'appointment.rescheduled_override'
          : 'appointment.rescheduled',
        targetType: 'appointment',
        targetId: id,
        reason: overriddenConflictId ? dto.overrideReason : dto.reason,
        before: { startAt: before.startAt, endAt: before.endAt },
        after: { startAt, endAt },
      });

      if (row.customerId) {
        const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
        const stylist = await this.stylists.findById(salonId, row.stylistId);
        await this.notifications.execute({
          salonId,
          key: 'appointment.rescheduled',
          customerId: row.customerId,
          dedupeKey: `appointment.rescheduled:${id}:${startAt.toISOString()}`,
          data: {
            stylistName: stylist?.displayName ?? '',
            startAt: formatLocal(startAt, tz),
          },
        });
      }
      return row;
    });

    this.realtime.publish(`bookings:${updated.stylistId}`, {
      appointmentId: id,
      status: updated.status,
    });
    this.realtime.publish(`front-desk:${updated.branchId}`, { appointmentId: id });
    return updated;
  }
}
