import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { refunds } from '../../persistence/schema/index.js';

export type RefundRow = typeof refunds.$inferSelect;

@Injectable()
export class RefundsRepo {
  constructor(private readonly database: DatabaseService) {}

  /** Total already refunded against one payment. */
  async sumForPayment(salonId: string, paymentId: string): Promise<number> {
    const [row] = await this.database.db
      .select({ n: sql<number>`coalesce(sum(${refunds.amountMinor}), 0)::int` })
      .from(refunds)
      .where(
        and(
          eq(refunds.salonId, salonId),
          eq(refunds.paymentId, paymentId),
          isNull(refunds.deletedAt),
        ),
      );
    return row?.n ?? 0;
  }

  async create(input: {
    salonId: string;
    paymentId: string;
    ticketId: string;
    branchId: string;
    amountMinor: number;
    reason: string;
    providerRef: string | null;
    approvedBy: string;
  }): Promise<RefundRow> {
    const [row] = await this.database.db
      .insert(refunds)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }
}
