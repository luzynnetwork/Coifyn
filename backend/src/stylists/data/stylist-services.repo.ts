import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { stylistServices } from '../../persistence/schema/index.js';

export type StylistServiceRow = typeof stylistServices.$inferSelect;

@Injectable()
export class StylistServicesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForStylist(stylistId: string): Promise<StylistServiceRow[]> {
    return this.database.db.query.stylistServices.findMany({
      where: eq(stylistServices.stylistId, stylistId),
    });
  }

  /** Replaces the full set of service links for a stylist — the caller always
   *  sends the complete matrix on `PUT /stylists/:id/services`. */
  async replaceForStylist(
    salonId: string,
    stylistId: string,
    entries: {
      serviceId: string;
      priceOverrideMinor: number | null;
      durationOverrideMin: number | null;
      canPerform: boolean;
    }[],
  ): Promise<StylistServiceRow[]> {
    await this.database.db
      .delete(stylistServices)
      .where(eq(stylistServices.stylistId, stylistId));
    if (entries.length === 0) return [];
    return this.database.db
      .insert(stylistServices)
      .values(
        entries.map((e) => ({
          id: uuidv7(),
          salonId,
          stylistId,
          serviceId: e.serviceId,
          priceOverrideMinor: e.priceOverrideMinor,
          durationOverrideMin: e.durationOverrideMin,
          canPerform: e.canPerform,
        })),
      )
      .returning();
  }
}
