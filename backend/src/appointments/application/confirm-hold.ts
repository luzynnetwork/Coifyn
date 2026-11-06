import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { BookingHoldsRepo } from '../data/booking-holds.repo.js';
import type { ConfirmHoldDto } from '../dto/appointment-phase2.dto.js';
import { AppointmentBooker } from './appointment-booker.js';

/** Turns a live hold into a real appointment and consumes the hold. */
@Injectable()
export class ConfirmHold {
  constructor(
    private readonly scope: TenantScope,
    private readonly holds: BookingHoldsRepo,
    private readonly booker: AppointmentBooker,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, dto: ConfirmHoldDto) {
    const created = await this.scope.run(user, async (salonId) => {
      const hold = await this.holds.findById(salonId, dto.holdId);
      if (!hold) throw new NotFoundException('Hold not found.');
      if (hold.consumedAt) throw new ConflictException('Hold was already used.');
      if (hold.expiresAt <= new Date()) {
        throw new ConflictException('Hold expired — pick the slot again.');
      }

      const row = await this.booker.book(
        user,
        salonId,
        {
          branchId: hold.branchId,
          stylistId: hold.stylistId,
          chairId: hold.chairId ?? undefined,
          customerId: dto.customerId,
          serviceIds: hold.serviceIds as string[],
          startAt: hold.startAt.toISOString(),
          endAt: hold.endAt.toISOString(),
          notes: dto.notes,
        },
        { holdId: hold.id },
      );
      await this.holds.consume(salonId, hold.id);
      return row;
    });
    this.realtime.publish(`bookings:${created.stylistId}`, {
      appointmentId: created.id,
      status: created.status,
    });
    this.realtime.publish(`front-desk:${created.branchId}`, { appointmentId: created.id });
    return created;
  }
}
