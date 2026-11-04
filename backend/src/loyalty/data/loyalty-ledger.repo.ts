import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { loyaltyLedger } from '../../persistence/schema/index.js';

export type LoyaltyLedgerRow = typeof loyaltyLedger.$inferSelect;
export type LedgerKind = 'earn' | 'redeem' | 'adjust' | 'expire';

/** Insert-only: the ledger is immutable, so there is no update or delete. */
@Injectable()
export class LoyaltyLedgerRepo {
  constructor(private readonly database: DatabaseService) {}

  list(salonId: string, customerId: string): Promise<LoyaltyLedgerRow[]> {
    return this.database.db.query.loyaltyLedger.findMany({
      where: and(
        eq(loyaltyLedger.salonId, salonId),
        eq(loyaltyLedger.customerId, customerId),
      ),
      orderBy: desc(loyaltyLedger.createdAt),
      limit: 200,
    });
  }

  async hasEntry(kind: LedgerKind, sourceId: string): Promise<boolean> {
    const row = await this.database.db.query.loyaltyLedger.findFirst({
      where: and(eq(loyaltyLedger.kind, kind), eq(loyaltyLedger.sourceId, sourceId)),
    });
    return !!row;
  }

  async sumFor(salonId: string, customerId: string): Promise<number> {
    const [row] = await this.database.db
      .select({ n: sql<number>`coalesce(sum(${loyaltyLedger.delta}), 0)::int` })
      .from(loyaltyLedger)
      .where(
        and(
          eq(loyaltyLedger.salonId, salonId),
          eq(loyaltyLedger.customerId, customerId),
        ),
      );
    return row?.n ?? 0;
  }

  async append(input: {
    salonId: string;
    customerId: string;
    kind: LedgerKind;
    delta: number;
    source: string;
    sourceId?: string | null;
    reason?: string | null;
    createdBy?: string | null;
  }): Promise<LoyaltyLedgerRow> {
    const [row] = await this.database.db
      .insert(loyaltyLedger)
      .values({
        id: uuidv7(),
        ...input,
        sourceId: input.sourceId ?? null,
        reason: input.reason ?? null,
        createdBy: input.createdBy ?? null,
      })
      .returning();
    return row;
  }
}
