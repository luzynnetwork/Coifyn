import { Injectable } from '@nestjs/common';
import {
  AppointmentsRepo,
  type AppointmentRow,
} from '../../appointments/data/appointments.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { StylistServicesRepo } from '../../stylists/data/stylist-services.repo.js';

/**
 * Who may be offered as a stand-in. "Vouched" means the salon has explicitly
 * marked the stylist able to perform every booked service (a `stylist_service`
 * row with `canPerform = true`). The stand-in must also be in the same branch,
 * bookable, and free for the appointment's time.
 */
@Injectable()
export class StandInFinder {
  constructor(
    private readonly stylists: StylistProfilesRepo,
    private readonly stylistServices: StylistServicesRepo,
    private readonly appointments: AppointmentsRepo,
  ) {}

  async isVouched(stylistId: string, serviceIds: string[]): Promise<boolean> {
    const matrix = await this.stylistServices.listForStylist(stylistId);
    return serviceIds.every((id) =>
      matrix.some((m) => m.serviceId === id && m.canPerform),
    );
  }

  async candidates(salonId: string, appt: AppointmentRow): Promise<string[]> {
    const serviceIds = appt.serviceIds as string[];
    const found: string[] = [];
    for (const s of await this.stylists.listForSalon(salonId)) {
      if (s.id === appt.stylistId || s.branchId !== appt.branchId || !s.isBookable) continue;
      if (['on_leave', 'off_shift'].includes(s.status)) continue;
      if (!(await this.isVouched(s.id, serviceIds))) continue;
      const clash = await this.appointments.findConflict(salonId, {
        stylistId: s.id,
        startAt: appt.startAt,
        endAt: appt.endAt,
      });
      if (!clash) found.push(s.id);
    }
    return found;
  }
}
