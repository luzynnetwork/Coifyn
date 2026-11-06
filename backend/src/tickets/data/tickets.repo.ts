import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { tickets } from '../../persistence/schema/index.js';

export type TicketRow = typeof tickets.$inferSelect;
export type TicketStatus = 'open' | 'paid' | 'voided';

export type TicketPatch = Partial<
  Pick<
    TicketRow,
    | 'customerId'
    | 'status'
    | 'subtotalMinor'
    | 'discountMinor'
    | 'taxMinor'
    | 'totalMinor'
    | 'paidAt'
    | 'voidReason'
    | 'voidedBy'
    | 'voidedAt'
  >
>;

@Injectable()
export class TicketsRepo {
  constructor(private readonly database: DatabaseService) {}

  list(
    salonId: string,
    filter: { branchId?: string; status?: TicketStatus },
  ): Promise<TicketRow[]> {
    return this.database.db.query.tickets.findMany({
      where: and(
        eq(tickets.salonId, salonId),
        isNull(tickets.deletedAt),
        filter.branchId ? eq(tickets.branchId, filter.branchId) : undefined,
        filter.status ? eq(tickets.status, filter.status) : undefined,
      ),
      orderBy: desc(tickets.createdAt),
      limit: 200,
    });
  }

  findById(salonId: string, id: string): Promise<TicketRow | undefined> {
    return this.database.db.query.tickets.findFirst({
      where: and(
        eq(tickets.id, id),
        eq(tickets.salonId, salonId),
        isNull(tickets.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    branchId: string;
    registerSessionId: string | null;
    source: string;
    sourceId: string | null;
    customerId: string | null;
    taxBasisPoints: number;
    taxInclusive: boolean;
  }): Promise<TicketRow> {
    const [row] = await this.database.db
      .insert(tickets)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: TicketPatch,
  ): Promise<TicketRow | undefined> {
    const [row] = await this.database.db
      .update(tickets)
      .set(patch)
      .where(and(eq(tickets.id, id), eq(tickets.salonId, salonId)))
      .returning();
    return row;
  }
}
