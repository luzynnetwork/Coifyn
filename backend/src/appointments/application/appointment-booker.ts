import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { formatLocal } from '../../common/day-bounds.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { DispatchNotification } from '../../notifications/application/dispatch-notification.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ServicesRepo } from '../../services/data/services.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { ChairsRepo } from '../../tenancy/data/chairs.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { AppointmentsRepo, type AppointmentRow } from '../data/appointments.repo.js';
import { BookingHoldsRepo } from '../data/booking-holds.repo.js';
import { AppointmentConflictGuard } from './appointment-conflict-guard.js';

export interface BookInput {
  branchId: string;
  stylistId: string;
  chairId?: string;
  customerId?: string;
  serviceIds: string[];
  addOnIds?: string[];
  startAt: string;
  endAt: string;
  notes?: string;
  overrideReason?: string;
}

/**
 * The one place an appointment is created. Runs inside the caller's tenant
 * transaction (a direct booking, a confirmed hold, or a confirmed customer
 * request all share it): validates references, enforces the no-double-booking
 * rule against appointments AND other people's live holds, writes the row,
 * event and audit entry, and sends the customer's confirmation.
 */
@Injectable()
export class AppointmentBooker {
  constructor(
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly chairs: ChairsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly customers: CustomersRepo,
    private readonly services: ServicesRepo,
    private readonly salons: SalonsRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly holds: BookingHoldsRepo,
    private readonly conflicts: AppointmentConflictGuard,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly notifications: DispatchNotification,
  ) {}

  async book(
    user: AuthUser,
    salonId: string,
    input: BookInput,
    opts: { source?: string; holdId?: string } = {},
  ): Promise<AppointmentRow> {
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (!(startAt < endAt)) {
      throw new BadRequestException('endAt must be after startAt.');
    }
    if (!(await this.branches.findById(salonId, input.branchId))) {
      throw new NotFoundException('Branch not found.');
    }
    await this.authorize.check(user, 'appointment:manage', {
      salonId,
      branchId: input.branchId,
    });

    const stylist = await this.stylists.findById(salonId, input.stylistId);
    if (!stylist) throw new BadRequestException('Unknown stylist.');
    if (input.chairId) {
      const chair = await this.chairs.findById(salonId, input.chairId);
      if (!chair || chair.branchId !== input.branchId || !chair.isActive) {
        throw new BadRequestException('Chair must be an active chair in this branch.');
      }
    }
    const customer = input.customerId
      ? await this.customers.findById(salonId, input.customerId)
      : undefined;
    if (input.customerId && !customer) {
      throw new BadRequestException('Unknown customer.');
    }
    for (const serviceId of input.serviceIds) {
      if (!(await this.services.findById(salonId, serviceId))) {
        throw new BadRequestException(`Unknown service ${serviceId}.`);
      }
    }

    const { overriddenConflictId } = await this.conflicts.assertFree(user, {
      salonId,
      branchId: input.branchId,
      stylistId: input.stylistId,
      chairId: input.chairId,
      startAt,
      endAt,
      overrideReason: input.overrideReason,
    });
    const foreignHolds = await this.holds.liveForStylist(
      salonId,
      input.stylistId,
      startAt,
      endAt,
      opts.holdId,
    );
    if (foreignHolds.length > 0 && !overriddenConflictId) {
      throw new ConflictException('That slot is being held for another booking.');
    }

    const row = await this.appointments.create({
      salonId,
      branchId: input.branchId,
      stylistId: input.stylistId,
      chairId: input.chairId ?? null,
      customerId: input.customerId ?? null,
      serviceIds: input.serviceIds,
      addOnIds: input.addOnIds ?? [],
      startAt,
      endAt,
      notes: input.notes ?? null,
      source: opts.source,
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
      action: overriddenConflictId ? 'appointment.booked_override' : 'appointment.booked',
      targetType: 'appointment',
      targetId: row.id,
      reason: overriddenConflictId ? input.overrideReason : undefined,
      after: {
        stylistId: row.stylistId,
        startAt: input.startAt,
        endAt: input.endAt,
        ...(overriddenConflictId && { overriddenConflictId }),
      },
    });

    if (customer) {
      const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      await this.notifications.execute({
        salonId,
        key: 'appointment.booked',
        customerId: customer.id,
        dedupeKey: `appointment.booked:${row.id}`,
        data: {
          stylistName: stylist.displayName,
          startAt: formatLocal(startAt, tz),
        },
      });
    }
    return row;
  }
}
