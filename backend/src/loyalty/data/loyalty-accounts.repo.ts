import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { loyaltyAccounts } from '../../persistence/schema/index.js';

export type LoyaltyAccountRow = typeof loyaltyAccounts.$inferSelect;

@Injectable()
export class LoyaltyAccountsRepo {
  constructor(private readonly database: DatabaseService) {}

  find(salonId: string, customerId: string) {
    return this.database.db.query.loyaltyAccounts.findFirst({
      where: and(
        eq(loyaltyAccounts.salonId, salonId),
        eq(loyaltyAccounts.customerId, customerId),
      ),
    });
  }

  async findOrCreate(
    salonId: string,
    customerId: string,
  ): Promise<LoyaltyAccountRow> {
    await this.database.db
      .insert(loyaltyAccounts)
      .values({ id: uuidv7(), salonId, customerId })
      .onConflictDoNothing();
    const row = await this.find(salonId, customerId);
    return row!;
  }

  /** Atomic balance change; returns the new row. */
  async addPoints(
    salonId: string,
    customerId: string,
    delta: number,
  ): Promise<LoyaltyAccountRow> {
    const [row] = await this.database.db
      .update(loyaltyAccounts)
      .set({ pointsBalance: sql`${loyaltyAccounts.pointsBalance} + ${delta}` })
      .where(
        and(
          eq(loyaltyAccounts.salonId, salonId),
          eq(loyaltyAccounts.customerId, customerId),
        ),
      )
      .returning();
    return row;
  }

  async setTier(salonId: string, customerId: string, tier: string | null) {
    await this.database.db
      .update(loyaltyAccounts)
      .set({ tier })
      .where(
        and(
          eq(loyaltyAccounts.salonId, salonId),
          eq(loyaltyAccounts.customerId, customerId),
        ),
      );
  }
}
