import { Injectable } from '@nestjs/common';
import { formatLocal } from '../../common/day-bounds.js';
import { DispatchNotification } from '../../notifications/application/dispatch-notification.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { AppointmentsRepo } from '../data/appointments.repo.js';

const HOUR = 3600 * 1000;

/**
 * The `appointment-reminders` job: 24 h and 2 h before a booked appointment.
 * Runs on a timer under system scope. Each reminder carries a dedupe key, so the
 * timer can fire as often as it likes and a customer still gets each reminder
 * once. A booking made inside the 24 h window skips the 24 h reminder (they
 * were only just told about it).
 */
@Injectable()
export class SendAppointmentReminders {
  constructor(
    private readonly database: DatabaseService,
    private readonly appointments: AppointmentsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly salons: SalonsRepo,
    private readonly notifications: DispatchNotification,
  ) {}

  execute(now = new Date()): Promise<{ sent: number }> {
    return this.database.withSystem(async () => {
      let sent = 0;
      const upcoming = await this.appointments.listBookedStartingBetween(
        now,
        new Date(now.getTime() + 24 * HOUR),
      );
      for (const appt of upcoming) {
        if (!appt.customerId) continue;
        const untilStart = appt.startAt.getTime() - now.getTime();
        const kind =
          untilStart <= 2 * HOUR
            ? '2h'
            : appt.createdAt.getTime() <= appt.startAt.getTime() - 24 * HOUR
              ? '24h'
              : null;
        if (!kind) continue;

        const tz = (await this.salons.findById(appt.salonId))?.timezone ?? 'UTC';
        const stylist = await this.stylists.findById(appt.salonId, appt.stylistId);
        const result = await this.notifications.execute({
          salonId: appt.salonId,
          key: kind === '2h' ? 'appointment.reminder_2h' : 'appointment.reminder_24h',
          customerId: appt.customerId,
          dedupeKey: `appointment.reminder_${kind}:${appt.id}`,
          data: {
            stylistName: stylist?.displayName ?? '',
            startAt: formatLocal(appt.startAt, tz),
          },
        });
        if (result.status === 'sent') sent++;
      }
      return { sent };
    });
  }
}
