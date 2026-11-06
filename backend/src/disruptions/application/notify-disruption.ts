import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { DispatchNotification } from '../../notifications/application/dispatch-notification.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { DisruptionOffersRepo, type OfferOption } from '../data/disruption-offers.repo.js';
import { DisruptionsRepo } from '../data/disruptions.repo.js';
import { StandInFinder } from './stand-in-finder.js';

const LABELS: Record<string, string> = {
  wait: 'wait for the stylist',
  next_slot: 'move to the next free slot',
  stand_in: 'switch to another stylist',
  cancel: 'cancel',
};

/**
 * Gives every affected customer their options (wait / next slot / vouched
 * stand-in / cancel) and tells them by message. One offer per appointment —
 * re-running the call only picks up appointments not yet notified.
 */
@Injectable()
export class NotifyDisruption {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly disruptions: DisruptionsRepo,
    private readonly offers: DisruptionOffersRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly standIns: StandInFinder,
    private readonly notifications: DispatchNotification,
    private readonly events: EventBus,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, disruptionId: string) {
    let branchId = '';
    const result = await this.scope.run(user, async (salonId) => {
      const disruption = await this.disruptions.findById(salonId, disruptionId);
      if (!disruption) throw new NotFoundException('Disruption not found.');
      branchId = disruption.branchId;
      await this.authorize.check(user, 'disruption:manage', {
        salonId,
        branchId: disruption.branchId,
      });

      const stylist = await this.stylists.findById(salonId, disruption.stylistId);
      const existing = await this.offers.listForDisruption(salonId, disruptionId);
      const affected = await this.appointments.listActiveForStylist(
        salonId,
        disruption.stylistId,
        disruption.windowStart,
        disruption.windowEnd,
      );

      const created = [];
      for (const appt of affected) {
        if (!appt.customerId) continue;
        if (existing.some((o) => o.appointmentId === appt.id)) continue;

        const options: OfferOption[] = [
          { choice: 'wait' },
          { choice: 'next_slot' },
        ];
        const stylistIds = await this.standIns.candidates(salonId, appt);
        if (stylistIds.length > 0) options.push({ choice: 'stand_in', stylistIds });
        options.push({ choice: 'cancel' });

        const offer = await this.offers.create({
          salonId,
          disruptionId,
          appointmentId: appt.id,
          branchId: disruption.branchId,
          options,
        });
        created.push(offer);

        const stylistName = stylist?.displayName ?? '';
        await this.notifications.execute({
          salonId,
          key: disruption.kind === 'running_late' ? 'stylist.running_late' : 'stylist.absent',
          customerId: appt.customerId,
          dedupeKey: `disruption:${disruptionId}:${appt.id}:notice`,
          data: { stylistName, minutes: disruption.minutesLate ?? '' },
        });
        await this.notifications.execute({
          salonId,
          key: 'disruption.options',
          customerId: appt.customerId,
          dedupeKey: `disruption:${disruptionId}:${appt.id}:options`,
          data: { options: options.map((o) => LABELS[o.choice]).join(', ') },
        });
        await this.events.emit({
          aggregateType: 'disruption',
          aggregateId: disruptionId,
          type: 'DisruptionOfferSent',
          salonId,
          payload: { disruptionId, offerId: offer.id },
        });
      }

      await this.disruptions.update(salonId, disruptionId, { notifiedAt: new Date() });
      return { notified: created.length, offers: created };
    });

    this.realtime.publish(`disruptions:${branchId}`, { disruptionId, notified: true });
    return result;
  }
}
