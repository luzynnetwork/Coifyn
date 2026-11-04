import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { formulaEntries } from '../../persistence/schema/index.js';

export type FormulaEntryRow = typeof formulaEntries.$inferSelect;
export type FormulaFields = Partial<
  Pick<FormulaEntryRow, 'kind' | 'formula' | 'developer' | 'processingMin' | 'notes'>
>;

@Injectable()
export class FormulaEntriesRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<FormulaEntryRow | undefined> {
    return this.database.db.query.formulaEntries.findFirst({
      where: and(
        eq(formulaEntries.id, id),
        eq(formulaEntries.salonId, salonId),
        isNull(formulaEntries.deletedAt),
      ),
    });
  }

  listForCustomer(salonId: string, customerId: string) {
    return this.database.db.query.formulaEntries.findMany({
      where: and(
        eq(formulaEntries.salonId, salonId),
        eq(formulaEntries.customerId, customerId),
        isNull(formulaEntries.deletedAt),
      ),
      orderBy: desc(formulaEntries.createdAt),
    });
  }

  async create(
    input: FormulaFields & {
      salonId: string;
      customerId: string;
      stylistId: string | null;
      kind: string;
      formula: string;
    },
  ): Promise<FormulaEntryRow> {
    const [row] = await this.database.db
      .insert(formulaEntries)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: FormulaFields,
  ): Promise<FormulaEntryRow | undefined> {
    const [row] = await this.database.db
      .update(formulaEntries)
      .set(patch)
      .where(and(eq(formulaEntries.id, id), eq(formulaEntries.salonId, salonId)))
      .returning();
    return row;
  }
}
