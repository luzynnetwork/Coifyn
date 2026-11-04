import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { loyaltyRules } from '../../persistence/schema/index.js';
import type { Tier } from '../domain/points.js';

export type LoyaltyRuleRow = typeof loyaltyRules.$inferSelect;

@Injectable()
export class LoyaltyRulesRepo {
  constructor(private readonly database: DatabaseService) {}

  find(salonId: string): Promise<LoyaltyRuleRow | undefined> {
    return this.database.db.query.loyaltyRules.findFirst({
      where: eq(loyaltyRules.salonId, salonId),
    });
  }

  /** The salon's rule, or the built-in default (1 point per currency unit). */
  async effective(salonId: string): Promise<{
    pointsPerUnit: number;
    tiers: Tier[];
    expiryDays: number | null;
  }> {
    const rule = await this.find(salonId);
    return {
      pointsPerUnit: rule?.pointsPerUnit ?? 1,
      tiers: (rule?.tiers as Tier[]) ?? [],
      expiryDays: rule?.expiryDays ?? null,
    };
  }

  /** Salons that expire points — system scope only (the expiry job). */
  listWithExpiry(): Promise<LoyaltyRuleRow[]> {
    return this.database.db.query.loyaltyRules
      .findMany()
      .then((rows) => rows.filter((r) => r.expiryDays));
  }

  async upsert(
    salonId: string,
    input: { pointsPerUnit: number; tiers: Tier[]; expiryDays: number | null },
  ): Promise<LoyaltyRuleRow> {
    const [row] = await this.database.db
      .insert(loyaltyRules)
      .values({ id: uuidv7(), salonId, ...input })
      .onConflictDoUpdate({ target: loyaltyRules.salonId, set: input })
      .returning();
    return row;
  }
}
