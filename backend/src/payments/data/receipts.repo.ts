import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { receipts } from '../../persistence/schema/index.js';

export type ReceiptRow = typeof receipts.$inferSelect;

@Injectable()
export class ReceiptsRepo {
  constructor(private readonly database: DatabaseService) {}

  findForTicket(
    salonId: string,
    ticketId: string,
  ): Promise<ReceiptRow | undefined> {
    return this.database.db.query.receipts.findFirst({
      where: and(
        eq(receipts.salonId, salonId),
        eq(receipts.ticketId, ticketId),
        isNull(receipts.deletedAt),
      ),
    });
  }

  /**
   * Issues the next per-salon receipt number. The advisory lock makes the
   * read-max-then-insert atomic across concurrent requests, so numbers are
   * unique and increase without gaps.
   */
  async issue(salonId: string, ticketId: string): Promise<ReceiptRow> {
    await this.database.db.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`receipt:${salonId}`}))`,
    );
    const [last] = await this.database.db
      .select({ n: sql<number>`coalesce(max(${receipts.sequence}), 0)::int` })
      .from(receipts)
      .where(eq(receipts.salonId, salonId));
    const sequence = (last?.n ?? 0) + 1;

    const [row] = await this.database.db
      .insert(receipts)
      .values({
        id: uuidv7(),
        salonId,
        ticketId,
        sequence,
        number: `R-${String(sequence).padStart(6, '0')}`,
      })
      .returning();
    return row;
  }
}
