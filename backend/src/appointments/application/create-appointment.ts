import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { ServicesRepo } from '../../services/data/services.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { ChairsRepo } from '../../tenancy/data/chairs.repo.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';
import type { CreateAppointmentDto } from '../dto/appointment.dto.js';
import { AppointmentConflictGuard } from './appointment-conflict-guard.js';

@Injectable()
export class CreateAppointment {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly chairs: ChairsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly customers: CustomersRepo,
    private readonly services: ServicesRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly conflicts: AppointmentConflictGuard,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, dto: CreateAppointmentDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (!(startAt < endAt)) {
      throw new BadRequestException('endAt must be after startAt.');
    }

    const salonId = await this.salon.execute(user);
    const created = await this.database.withTenant(
      user.id,
      salonId,
      async () => {
        if (!(await this.branches.findById(salonId, dto.branchId))) {
          throw new NotFoundException('Branch not found.');
        }
        await this.authorize.check(user, 'appointment:manage', {
          salonId,
          branchId: dto.branchId,
        });

        if (!(await this.stylists.findById(salonId, dto.stylistId))) {
          throw new BadRequestException('Unknown stylist.');
        }
        if (dto.chairId) {
          const chair = await this.chairs.findById(salonId, dto.chairId);
          if (!chair || chair.branchId !== dto.branchId || !chair.isActive) {
            throw new BadRequestException(
              'Chair must be an active chair in this branch.',
            );
          }
        }
        if (
          dto.customerId &&
          !(await this.customers.findById(salonId, dto.customerId))
        ) {
          throw new BadRequestException('Unknown customer.');
        }
        for (const serviceId of dto.serviceIds) {
          if (!(await this.services.findById(salonId, serviceId))) {
            throw new BadRequestException(`Unknown service ${serviceId}.`);
          }
        }

        const { overriddenConflictId } = await this.conflicts.assertFree(user, {
          salonId,
          branchId: dto.branchId,
          stylistId: dto.stylistId,
          chairId: dto.chairId,
          startAt,
          endAt,
          overrideReason: dto.overrideReason,
        });

        const row = await this.appointments.create({
          salonId,
          branchId: dto.branchId,
          stylistId: dto.stylistId,
          chairId: dto.chairId ?? null,
          customerId: dto.customerId ?? null,
          serviceIds: dto.serviceIds,
          addOnIds: dto.addOnIds ?? [],
          startAt,
          endAt,
          notes: dto.notes ?? null,
        });

        await this.events.emit({
          aggregateType: 'appointment',
          aggregateId: row.id,
          type: 'AppointmentBooked',
          salonId,
          payload: {
            appointmentId: row.id,
            branchId: row.branchId,
            stylistId: row.stylistId,
          },
        });
        await this.audit.write({
          salonId,
          actor: user,
          action: overriddenConflictId
            ? 'appointment.booked_override'
            : 'appointment.booked',
          targetType: 'appointment',
          targetId: row.id,
          reason: overriddenConflictId ? dto.overrideReason : undefined,
          after: {
            stylistId: row.stylistId,
            startAt: dto.startAt,
            endAt: dto.endAt,
            ...(overriddenConflictId && { overriddenConflictId }),
          },
        });
        return row;
      },
    );

    this.realtime.publish(`bookings:${created.stylistId}`, {
      appointmentId: created.id,
      status: created.status,
    });
    return created;
  }
}
