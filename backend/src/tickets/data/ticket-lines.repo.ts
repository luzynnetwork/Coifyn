import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { ticketLines } from '../../persistence/schema/index.js';

export type TicketLineRow = typeof ticketLines.$inferSelect;

@Injectable()
export class TicketLinesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForTicket(salonId: string, ticketId: string): Promise<TicketLineRow[]> {
    return this.database.db.query.ticketLines.findMany({
      where: and(
        eq(ticketLines.salonId, salonId),
        eq(ticketLines.ticketId, ticketId),
        isNull(ticketLines.deletedAt),
      ),
      orderBy: asc(ticketLines.createdAt),
    });
  }

  findById(
    salonId: string,
    ticketId: string,
    id: string,
  ): Promise<TicketLineRow | undefined> {
    return this.database.db.query.ticketLines.findFirst({
      where: and(
        eq(ticketLines.id, id),
        eq(ticketLines.ticketId, ticketId),
        eq(ticketLines.salonId, salonId),
        isNull(ticketLines.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    ticketId: string;
    kind: 'service' | 'add_on';
    refId: string;
    stylistId: string | null;
    description: string;
    qty: number;
    unitPriceMinor: number;
  }): Promise<TicketLineRow> {
    const [row] = await this.database.db
      .insert(ticketLines)
      .values({
        id: uuidv7(),
        ...input,
        lineTotalMinor: input.unitPriceMinor * input.qty,
      })
      .returning();
    return row;
  }

  async updateQty(
    salonId: string,
    id: string,
    qty: number,
    unitPriceMinor: number,
  ): Promise<TicketLineRow | undefined> {
    const [row] = await this.database.db
      .update(ticketLines)
      .set({ qty, lineTotalMinor: unitPriceMinor * qty })
      .where(and(eq(ticketLines.id, id), eq(ticketLines.salonId, salonId)))
      .returning();
    return row;
  }

  async softDelete(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(ticketLines)
      .set({ deletedAt: new Date() })
      .where(and(eq(ticketLines.id, id), eq(ticketLines.salonId, salonId)));
  }
}
