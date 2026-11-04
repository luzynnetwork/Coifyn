import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { StylistServicesRepo } from '../../stylists/data/stylist-services.repo.js';
import {
  ACTIVE_STATUSES,
  AppointmentsRepo,
  type AppointmentRow,
  type AppointmentStatus,
} from '../data/appointments.repo.js';
import type { ReassignStylistDto } from '../dto/appointment-phase2.dto.js';
import { AppointmentConflictGuard } from './appointment-conflict-guard.js';

/**
 * Hands an appointment to a stand-in. `originalStylistId` records the stylist
 * the customer chose (kept across repeated reassignments) so history still
 * credits them. Runs in the caller's scope via {@link reassign} so the
 * disruption flow can reuse it.
 */
@Injectable()
export class ReassignStylist {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly appointments: AppointmentsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly stylistServices: StylistServicesRepo,
    private readonly conflicts: AppointmentConflictGuard,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string, dto: ReassignStylistDto) {
    const result = await this.scope.run(user, (salonId) =>
      this.reassign(user, salonId, id, dto),
    );
    this.announce(result.updated, result.previousStylistId);
    return result.updated;
  }

  /** Must run inside a tenant scope. */
  async reassign(
    user: AuthUser,
    salonId: string,
    id: string,
    dto: ReassignStylistDto,
  ): Promise<{ updated: AppointmentRow; previousStylistId: string }> {
    const before = await this.appointments.findById(salonId, id);
    if (!before) throw new NotFoundException('Appointment not found.');
    await this.authorize.check(user, 'appointment:manage', {
      salonId,
      branchId: before.branchId,
    });
    if (!ACTIVE_STATUSES.includes(before.status as AppointmentStatus)) {
      throw new ConflictException(`A ${before.status} appointment cannot be reassigned.`);
    }
    if (dto.stylistId === before.stylistId) {
      throw new BadRequestException('Appointment already belongs to that stylist.');
    }

    const standIn = await this.stylists.findById(salonId, dto.stylistId);
    if (!standIn) throw new BadRequestException('Unknown stylist.');
    const matrix = await this.stylistServices.listForStylist(standIn.id);
    for (const serviceId of before.serviceIds as string[]) {
      if (matrix.some((m) => m.serviceId === serviceId && !m.canPerform)) {
        throw new BadRequestException(`${standIn.displayName} does not offer a booked service.`);
      }
    }

    const { overriddenConflictId } = await this.conflicts.assertFree(user, {
      salonId,
      branchId: before.branchId,
      stylistId: standIn.id,
      chairId: before.chairId,
      startAt: before.startAt,
      endAt: before.endAt,
      excludeId: id,
      overrideReason: dto.overrideReason,
    });

    const originalStylistId = before.originalStylistId ?? before.stylistId;
    const updated =
      (await this.appointments.update(salonId, id, {
        stylistId: standIn.id,
        originalStylistId,
      })) ?? before;

    await this.events.emit({
      aggregateType: 'appointment',
      aggregateId: id,
      type: 'AppointmentStylistReassigned',
      salonId,
      payload: {
        appointmentId: id,
        branchId: before.branchId,
        stylistId: standIn.id,
        originalStylistId,
      },
    });
    await this.audit.write({
      salonId,
      actor: user,
      action: overriddenConflictId
        ? 'appointment.reassigned_override'
        : 'appointment.reassigned',
      targetType: 'appointment',
      targetId: id,
      reason: dto.reason ?? dto.overrideReason,
      before: { stylistId: before.stylistId },
      after: { stylistId: standIn.id, originalStylistId },
    });
    return { updated, previousStylistId: before.stylistId };
  }

  announce(updated: AppointmentRow, previousStylistId: string): void {
    for (const stylistId of new Set([updated.stylistId, previousStylistId])) {
      this.realtime.publish(`bookings:${stylistId}`, {
        appointmentId: updated.id,
        status: updated.status,
      });
    }
    this.realtime.publish(`front-desk:${updated.branchId}`, {
      appointmentId: updated.id,
    });
  }
}
