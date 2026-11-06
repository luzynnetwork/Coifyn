import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { payments } from '../../persistence/schema/index.js';

export type PaymentRow = typeof payments.$inferSelect;
export type PaymentMethod = 'cash' | 'card';

@Injectable()
export class PaymentsRepo {
  constructor(private readonly database: DatabaseService) {}

  /** Serialises payments on one ticket until the transaction ends, so two
   *  simultaneous requests cannot both pay the same balance. */
  async lockTicket(ticketId: string): Promise<void> {
    await this.database.db.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`ticket-pay:${ticketId}`}))`,
    );
  }

  findById(salonId: string, id: string): Promise<PaymentRow | undefined> {
    return this.database.db.query.payments.findFirst({
      where: and(
        eq(payments.id, id),
        eq(payments.salonId, salonId),
        isNull(payments.deletedAt),
      ),
    });
  }

  list(
    salonId: string,
    filter: { ticketId?: string; branchId?: string },
  ): Promise<PaymentRow[]> {
    return this.database.db.query.payments.findMany({
      where: and(
        eq(payments.salonId, salonId),
        isNull(payments.deletedAt),
        filter.ticketId ? eq(payments.ticketId, filter.ticketId) : undefined,
        filter.branchId ? eq(payments.branchId, filter.branchId) : undefined,
      ),
      orderBy: desc(payments.createdAt),
      limit: 200,
    });
  }

  /** Total of completed payments on a ticket — the amount actually taken. */
  async sumCompleted(salonId: string, ticketId: string): Promise<number> {
    const [row] = await this.database.db
      .select({ n: sql<number>`coalesce(sum(${payments.amountMinor}), 0)::int` })
      .from(payments)
      .where(
        and(
          eq(payments.salonId, salonId),
          eq(payments.ticketId, ticketId),
          eq(payments.status, 'completed'),
          isNull(payments.deletedAt),
        ),
      );
    return row?.n ?? 0;
  }

  async create(input: {
    salonId: string;
    ticketId: string;
    branchId: string;
    registerSessionId: string | null;
    method: PaymentMethod;
    amountMinor: number;
    status: 'completed' | 'failed';
    providerRef: string | null;
    failureReason: string | null;
    takenBy: string;
  }): Promise<PaymentRow> {
    const [row] = await this.database.db
      .insert(payments)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }
}
