import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';

export interface SlotRequest {
  salonId: string;
  branchId: string;
  stylistId: string;
  chairId?: string | null;
  startAt: Date;
  endAt: Date;
  excludeId?: string;
  overrideReason?: string;
}

/**
 * The "no double-booking" rule. Locks the stylist and chair for the rest of the
 * transaction, then refuses if an active appointment overlaps. A caller holding
 * `appointment:override` may book over a conflict by giving a reason; the
 * returned value tells the caller to record that override in the audit log.
 */
@Injectable()
export class AppointmentConflictGuard {
  constructor(
    private readonly appointments: AppointmentsRepo,
    private readonly authorize: Authorize,
  ) {}

  async assertFree(
    user: AuthUser,
    slot: SlotRequest,
  ): Promise<{ overriddenConflictId: string | null }> {
    await this.appointments.lockResources([
      `stylist:${slot.stylistId}`,
      ...(slot.chairId ? [`chair:${slot.chairId}`] : []),
    ]);

    const conflict = await this.appointments.findConflict(slot.salonId, slot);
    if (!conflict) return { overriddenConflictId: null };

    if (!slot.overrideReason) {
      throw new ConflictException(
        'That stylist or chair is already booked for an overlapping time.',
      );
    }
    await this.authorize.check(user, 'appointment:override', {
      salonId: slot.salonId,
      branchId: slot.branchId,
    });
    return { overriddenConflictId: conflict.id };
  }
}
