import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { ReassignStylist } from '../../appointments/application/reassign-stylist.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { DisruptionOffersRepo, type OfferOption } from '../data/disruption-offers.repo.js';
import { DisruptionsRepo } from '../data/disruptions.repo.js';
import type { ResolveOfferDto } from '../dto/disruption.dto.js';
import { StandInFinder } from './stand-in-finder.js';

/**
 * Staff records the customer's choice. `cancel` cancels the appointment;
 * `stand_in` reassigns it to a vouched stylist (keeping `originalStylistId`);
 * `wait` / `next_slot` are recorded and the front desk follows up with the
 * reschedule endpoint. When every offer is answered the disruption closes.
 */
@Injectable()
export class ResolveOffer {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly offers: DisruptionOffersRepo,
    private readonly disruptions: DisruptionsRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly reassign: ReassignStylist,
    private readonly standIns: StandInFinder,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, offerId: string, dto: ResolveOfferDto) {
    let announce = undefined as (() => void) | undefined;
    let branchId = '';
    const offer = await this.scope.run(user, async (salonId) => {
      const current = await this.offers.findById(salonId, offerId);
      if (!current) throw new NotFoundException('Offer not found.');
      branchId = current.branchId;
      await this.authorize.check(user, 'disruption:manage', {
        salonId,
        branchId: current.branchId,
      });
      if (current.choice !== 'pending') {
        throw new ConflictException(`Offer already resolved (${current.choice}).`);
      }

      const options = current.options as OfferOption[];
      const option = options.find((o) => o.choice === dto.choice);
      if (!option) throw new BadRequestException('That choice was not offered.');

      const appt = await this.appointments.findById(salonId, current.appointmentId);
      if (!appt) throw new NotFoundException('Appointment not found.');

      if (dto.choice === 'stand_in') {
        const standInId = dto.standInStylistId;
        if (!standInId || !option.stylistIds?.includes(standInId)) {
          throw new BadRequestException('Pick one of the offered stand-ins.');
        }
        if (!(await this.standIns.isVouched(standInId, appt.serviceIds as string[]))) {
          throw new BadRequestException('Stand-in is not vouched for these services.');
        }
        const { updated, previousStylistId } = await this.reassign.reassign(
          user,
          salonId,
          appt.id,
          { stylistId: standInId, reason: 'disruption stand-in' },
        );
        announce = () => this.reassign.announce(updated, previousStylistId);
      } else if (dto.choice === 'cancel') {
        await this.appointments.update(salonId, appt.id, { status: 'cancelled' });
        await this.events.emit({
          aggregateType: 'appointment',
          aggregateId: appt.id,
          type: 'AppointmentCancelled',
          salonId,
          payload: {
            appointmentId: appt.id,
            branchId: appt.branchId,
            stylistId: appt.stylistId,
          },
        });
        await this.audit.write({
          salonId,
          actor: user,
          action: 'appointment.cancelled',
          targetType: 'appointment',
          targetId: appt.id,
          reason: 'disruption offer: customer cancelled',
          before: { status: appt.status },
          after: { status: 'cancelled' },
        });
      }

      const row =
        (await this.offers.update(salonId, offerId, {
          choice: dto.choice,
          standInStylistId: dto.choice === 'stand_in' ? dto.standInStylistId : null,
          resolvedAt: new Date(),
        })) ?? current;

      await this.events.emit({
        aggregateType: 'disruption_offer',
        aggregateId: offerId,
        type: 'DisruptionOfferResolved',
        salonId,
        payload: { offerId, choice: dto.choice },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'disruption.offer_resolved',
        targetType: 'disruption_offer',
        targetId: offerId,
        after: { choice: dto.choice, standInStylistId: dto.standInStylistId },
      });

      const siblings = await this.offers.listForDisruption(salonId, current.disruptionId);
      if (siblings.every((o) => o.choice !== 'pending')) {
        await this.disruptions.update(salonId, current.disruptionId, { status: 'resolved' });
      }
      return row;
    });

    announce?.();
    this.realtime.publish(`disruptions:${branchId}`, { offerId, choice: dto.choice });
    return offer;
  }
}
