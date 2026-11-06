import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { ChairsRepo } from '../../tenancy/data/chairs.repo.js';
import {
  ACTIVE_STATUSES,
  AppointmentsRepo,
  type AppointmentPatch,
  type AppointmentStatus,
} from '../data/appointments.repo.js';
import type { UpdateAppointmentDto } from '../dto/appointment.dto.js';
import { AppointmentConflictGuard } from './appointment-conflict-guard.js';

/** Move, reassign or annotate a booking. The overlap rule re-runs on any change
 *  to time, stylist or chair (excluding the appointment itself). */
@Injectable()
export class UpdateAppointment {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly chairs: ChairsRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly conflicts: AppointmentConflictGuard,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string, dto: UpdateAppointmentDto) {
    const salonId = await this.salon.execute(user);
    const result = await this.database.withTenant(user.id, salonId, async () => {
      const before = await this.appointments.findById(salonId, id);
      if (!before) throw new NotFoundException('Appointment not found.');

      await this.authorize.check(user, 'appointment:manage', {
        salonId,
        branchId: before.branchId,
      });
      if (!ACTIVE_STATUSES.includes(before.status as AppointmentStatus)) {
        throw new ConflictException(
          `A ${before.status} appointment can no longer be changed.`,
        );
      }

      const startAt = dto.startAt ? new Date(dto.startAt) : before.startAt;
      const endAt = dto.endAt ? new Date(dto.endAt) : before.endAt;
      if (!(startAt < endAt)) {
        throw new BadRequestException('endAt must be after startAt.');
      }
      const stylistId = dto.stylistId ?? before.stylistId;
      const chairId = dto.chairId ?? before.chairId;

      if (
        dto.stylistId &&
        !(await this.stylists.findById(salonId, dto.stylistId))
      ) {
        throw new BadRequestException('Unknown stylist.');
      }
      if (dto.chairId) {
        const chair = await this.chairs.findById(salonId, dto.chairId);
        if (!chair || chair.branchId !== before.branchId || !chair.isActive) {
          throw new BadRequestException(
            'Chair must be an active chair in this branch.',
          );
        }
      }

      const moved =
        dto.startAt || dto.endAt || dto.stylistId || dto.chairId;
      let overriddenConflictId: string | null = null;
      if (moved) {
        ({ overriddenConflictId } = await this.conflicts.assertFree(user, {
          salonId,
          branchId: before.branchId,
          stylistId,
          chairId,
          startAt,
          endAt,
          excludeId: id,
          overrideReason: dto.overrideReason,
        }));
      }

      const patch: AppointmentPatch = {
        ...(dto.stylistId && { stylistId: dto.stylistId }),
        ...(dto.chairId && { chairId: dto.chairId }),
        ...(dto.startAt && { startAt }),
        ...(dto.endAt && { endAt }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      };
      const updated = (await this.appointments.update(salonId, id, patch)) ?? before;

      await this.audit.write({
        salonId,
        actor: user,
        action: overriddenConflictId
          ? 'appointment.updated_override'
          : 'appointment.updated',
        targetType: 'appointment',
        targetId: id,
        reason: overriddenConflictId ? dto.overrideReason : undefined,
        before: {
          stylistId: before.stylistId,
          startAt: before.startAt,
          endAt: before.endAt,
        },
        after: patch,
      });
      return { updated, previousStylistId: before.stylistId };
    });

    for (const stylistId of new Set([
      result.previousStylistId,
      result.updated.stylistId,
    ])) {
      this.realtime.publish(`bookings:${stylistId}`, {
        appointmentId: id,
        status: result.updated.status,
      });
    }
    return result.updated;
  }
}
