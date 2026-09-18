import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { taxRates } from '../../persistence/schema/index.js';

export type TaxRateRow = typeof taxRates.$inferSelect;

@Injectable()
export class TaxRatesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForSalon(salonId: string): Promise<TaxRateRow[]> {
    return this.database.db.query.taxRates.findMany({
      where: and(eq(taxRates.salonId, salonId), isNull(taxRates.deletedAt)),
    });
  }

  findById(salonId: string, id: string): Promise<TaxRateRow | undefined> {
    return this.database.db.query.taxRates.findFirst({
      where: and(
        eq(taxRates.id, id),
        eq(taxRates.salonId, salonId),
        isNull(taxRates.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    name: string;
    percentBasisPoints: number;
    inclusive: boolean;
    isDefault: boolean;
  }): Promise<TaxRateRow> {
    const [row] = await this.database.db
      .insert(taxRates)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<
      Pick<
        TaxRateRow,
        'name' | 'percentBasisPoints' | 'inclusive' | 'isDefault' | 'isActive'
      >
    >,
  ): Promise<TaxRateRow | undefined> {
    const [row] = await this.database.db
      .update(taxRates)
      .set(patch)
      .where(and(eq(taxRates.id, id), eq(taxRates.salonId, salonId)))
      .returning();
    return row;
  }

  /** Clears isDefault on every other rate for the salon — call before setting
   *  a new default so exactly one rate is ever the default. */
  async clearDefault(salonId: string): Promise<void> {
    await this.database.db
      .update(taxRates)
      .set({ isDefault: false })
      .where(and(eq(taxRates.salonId, salonId), eq(taxRates.isDefault, true)));
  }
}
