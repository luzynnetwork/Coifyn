import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { bookingHolds } from '../../persistence/schema/index.js';

export type BookingHoldRow = typeof bookingHolds.$inferSelect;

/** How long a hold keeps a slot while the booking flow completes. */
export const HOLD_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class BookingHoldsRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<BookingHoldRow | undefined> {
    return this.database.db.query.bookingHolds.findFirst({
      where: and(eq(bookingHolds.id, id), eq(bookingHolds.salonId, salonId)),
    });
  }

  /** Unexpired, unconsumed holds on a stylist overlapping [from, to). */
  liveForStylist(
    salonId: string,
    stylistId: string,
    from: Date,
    to: Date,
    excludeId?: string,
  ): Promise<BookingHoldRow[]> {
    return this.database.db.query.bookingHolds
      .findMany({
        where: and(
          eq(bookingHolds.salonId, salonId),
          eq(bookingHolds.stylistId, stylistId),
          isNull(bookingHolds.consumedAt),
          gt(bookingHolds.expiresAt, new Date()),
          gt(bookingHolds.endAt, from),
          lt(bookingHolds.startAt, to),
        ),
      })
      .then((rows) => rows.filter((r) => r.id !== excludeId));
  }

  async create(input: {
    salonId: string;
    branchId: string;
    stylistId: string;
    chairId: string | null;
    serviceIds: string[];
    startAt: Date;
    endAt: Date;
    heldBy: string;
  }): Promise<BookingHoldRow> {
    const [row] = await this.database.db
      .insert(bookingHolds)
      .values({
        id: uuidv7(),
        ...input,
        expiresAt: new Date(Date.now() + HOLD_TTL_MS),
      })
      .returning();
    return row;
  }

  async consume(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(bookingHolds)
      .set({ consumedAt: new Date() })
      .where(and(eq(bookingHolds.id, id), eq(bookingHolds.salonId, salonId)));
  }
}
