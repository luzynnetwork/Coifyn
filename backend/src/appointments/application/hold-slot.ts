import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';
import { BookingHoldsRepo } from '../data/booking-holds.repo.js';
import type { HoldSlotDto } from '../dto/appointment-phase2.dto.js';

/** Locks a slot for a few minutes while a booking flow completes. */
@Injectable()
export class HoldSlot {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly holds: BookingHoldsRepo,
  ) {}

  execute(user: AuthUser, dto: HoldSlotDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'appointment:manage', {
        salonId,
        branchId: dto.branchId,
      });
      if (!(await this.stylists.findById(salonId, dto.stylistId))) {
        throw new NotFoundException('Stylist not found.');
      }

      // Serialise with concurrent bookings/holds for this stylist.
      await this.appointments.lockResources([`stylist:${dto.stylistId}`]);
      if (
        await this.appointments.findConflict(salonId, {
          stylistId: dto.stylistId,
          chairId: dto.chairId,
          startAt,
          endAt,
        })
      ) {
        throw new ConflictException('That slot is already booked.');
      }
      const live = await this.holds.liveForStylist(salonId, dto.stylistId, startAt, endAt);
      if (live.length > 0) {
        throw new ConflictException('That slot is being held for another booking.');
      }

      return this.holds.create({
        salonId,
        branchId: dto.branchId,
        stylistId: dto.stylistId,
        chairId: dto.chairId ?? null,
        serviceIds: dto.serviceIds,
        startAt,
        endAt,
        heldBy: user.id,
      });
    });
  }
}
