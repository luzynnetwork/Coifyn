import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { ticketDiscounts } from '../../persistence/schema/index.js';

export type TicketDiscountRow = typeof ticketDiscounts.$inferSelect;

@Injectable()
export class TicketDiscountsRepo {
  constructor(private readonly database: DatabaseService) {}

  findForTicket(
    salonId: string,
    ticketId: string,
  ): Promise<TicketDiscountRow | undefined> {
    return this.database.db.query.ticketDiscounts.findFirst({
      where: and(
        eq(ticketDiscounts.salonId, salonId),
        eq(ticketDiscounts.ticketId, ticketId),
        isNull(ticketDiscounts.deletedAt),
      ),
    });
  }

  /** One discount per ticket: replaces any existing one. */
  async replace(input: {
    salonId: string;
    ticketId: string;
    type: 'percent' | 'amount';
    value: number;
    reason: string;
    approvedBy: string;
  }): Promise<TicketDiscountRow> {
    const [row] = await this.database.db
      .insert(ticketDiscounts)
      .values({ id: uuidv7(), ...input })
      .onConflictDoUpdate({
        target: ticketDiscounts.ticketId,
        set: {
          type: input.type,
          value: input.value,
          reason: input.reason,
          approvedBy: input.approvedBy,
          deletedAt: null,
        },
      })
      .returning();
    return row;
  }
}
