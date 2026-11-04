import { Injectable } from '@nestjs/common';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { disruptionOffers } from '../../persistence/schema/index.js';

export type DisruptionOfferRow = typeof disruptionOffers.$inferSelect;
export type OfferChoice = 'wait' | 'next_slot' | 'stand_in' | 'cancel';

export interface OfferOption {
  choice: OfferChoice;
  /** For `stand_in`: the vouched stylists the customer may pick from. */
  stylistIds?: string[];
}

@Injectable()
export class DisruptionOffersRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<DisruptionOfferRow | undefined> {
    return this.database.db.query.disruptionOffers.findFirst({
      where: and(
        eq(disruptionOffers.id, id),
        eq(disruptionOffers.salonId, salonId),
        isNull(disruptionOffers.deletedAt),
      ),
    });
  }

  listForDisruption(salonId: string, disruptionId: string) {
    return this.database.db.query.disruptionOffers.findMany({
      where: and(
        eq(disruptionOffers.salonId, salonId),
        eq(disruptionOffers.disruptionId, disruptionId),
        isNull(disruptionOffers.deletedAt),
      ),
    });
  }

  /** Pending offers sent before `cutoff` that were never escalated — system
   *  scope only (the escalation job spans salons). */
  listStalePending(cutoff: Date): Promise<DisruptionOfferRow[]> {
    return this.database.db.query.disruptionOffers.findMany({
      where: and(
        eq(disruptionOffers.choice, 'pending'),
        isNull(disruptionOffers.escalatedAt),
        lt(disruptionOffers.sentAt, cutoff),
        isNull(disruptionOffers.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    disruptionId: string;
    appointmentId: string;
    branchId: string;
    options: OfferOption[];
  }): Promise<DisruptionOfferRow> {
    const [row] = await this.database.db
      .insert(disruptionOffers)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<
      Pick<
        DisruptionOfferRow,
        'choice' | 'standInStylistId' | 'resolvedAt' | 'escalatedAt'
      >
    >,
  ): Promise<DisruptionOfferRow | undefined> {
    const [row] = await this.database.db
      .update(disruptionOffers)
      .set(patch)
      .where(
        and(eq(disruptionOffers.id, id), eq(disruptionOffers.salonId, salonId)),
      )
      .returning();
    return row;
  }
}
