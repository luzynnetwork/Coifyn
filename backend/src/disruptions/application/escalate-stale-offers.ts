import { Injectable } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { DisruptionOffersRepo } from '../data/disruption-offers.repo.js';

/** Offers unanswered for this long are escalated to the front desk. */
export const ESCALATE_AFTER_MIN = 10;

/** The `disruption-escalate` job. System scope — spans every salon. Marking
 *  `escalatedAt` makes it idempotent; the front desk's panel highlights those
 *  offers and is nudged over `disruptions:<branchId>`. */
@Injectable()
export class EscalateStaleOffers {
  constructor(
    private readonly database: DatabaseService,
    private readonly offers: DisruptionOffersRepo,
    private readonly events: EventBus,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(now = new Date()): Promise<{ escalated: number }> {
    const cutoff = new Date(now.getTime() - ESCALATE_AFTER_MIN * 60000);
    const branches = new Set<string>();
    const escalated = await this.database.withSystem(async () => {
      const stale = await this.offers.listStalePending(cutoff);
      for (const offer of stale) {
        await this.offers.update(offer.salonId, offer.id, { escalatedAt: now });
        await this.events.emit({
          aggregateType: 'disruption_offer',
          aggregateId: offer.id,
          type: 'DisruptionOfferEscalated',
          salonId: offer.salonId,
          payload: { offerId: offer.id },
        });
        branches.add(offer.branchId);
      }
      return stale.length;
    });
    for (const branchId of branches) {
      this.realtime.publish(`disruptions:${branchId}`, { escalated: true });
    }
    return { escalated };
  }
}
