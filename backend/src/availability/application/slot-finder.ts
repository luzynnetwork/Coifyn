import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingHoldsRepo } from '../../appointments/data/booking-holds.repo.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { ServicesRepo } from '../../services/data/services.repo.js';
import { StylistServicesRepo } from '../../stylists/data/stylist-services.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { computeSlots, type Interval } from '../domain/compute-slots.js';
import { ShiftsRepo } from '../data/shifts.repo.js';
import { TimeOffRepo } from '../data/time-off.repo.js';

/**
 * Open slots for one stylist on one local day. Scope-agnostic: it reads through
 * the ambient database scope, so the authenticated endpoint (tenant scope) and
 * the public customer endpoint (system scope, one salon's id) share it.
 */
@Injectable()
export class SlotFinder {
  constructor(
    private readonly salons: SalonsRepo,
    private readonly services: ServicesRepo,
    private readonly stylistServices: StylistServicesRepo,
    private readonly shifts: ShiftsRepo,
    private readonly timeOff: TimeOffRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly holds: BookingHoldsRepo,
  ) {}

  /** Minutes the stylist needs for these services (their override, else base). */
  async durationFor(
    salonId: string,
    stylistId: string,
    serviceIds: string[],
  ): Promise<number> {
    const overrides = await this.stylistServices.listForStylist(stylistId);
    let total = 0;
    for (const id of serviceIds) {
      const service = await this.services.findById(salonId, id);
      if (!service) throw new BadRequestException(`Unknown service ${id}.`);
      const override = overrides.find((o) => o.serviceId === id);
      if (override && !override.canPerform) {
        throw new BadRequestException('This stylist does not offer that service.');
      }
      total += override?.durationOverrideMin ?? service.baseDurationMin;
    }
    return total;
  }

  async find(input: {
    salonId: string;
    stylistId: string;
    serviceIds: string[];
    date: string;
  }): Promise<Interval[]> {
    const { salonId, stylistId } = input;
    const salon = await this.salons.findById(salonId);
    const { from, to } = dayBoundsUtc(input.date, salon?.timezone ?? 'UTC');
    const durationMin = await this.durationFor(salonId, stylistId, input.serviceIds);

    const [shifts, appts, holds, off] = await Promise.all([
      this.shifts.listForStylist(salonId, stylistId, from, to),
      this.appointments.listActiveForStylist(salonId, stylistId, from, to),
      this.holds.liveForStylist(salonId, stylistId, from, to),
      this.timeOff.approvedOverlapping(salonId, stylistId, from, to),
    ]);

    return computeSlots({
      shifts: shifts.map((s) => ({ startAt: s.startAt, endAt: s.endAt })),
      busy: [
        ...appts.map((a) => ({ startAt: a.startAt, endAt: a.endAt })),
        ...holds.map((h) => ({ startAt: h.startAt, endAt: h.endAt })),
        ...off.map((o) => ({ startAt: o.fromAt, endAt: o.toAt })),
      ],
      durationMin,
      notBefore: new Date(),
    });
  }
}
