import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { shiftTemplates } from '../../persistence/schema/index.js';
import type { PatternEntry } from '../domain/expand-template.js';

export type ShiftTemplateRow = typeof shiftTemplates.$inferSelect;

@Injectable()
export class ShiftTemplatesRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<ShiftTemplateRow | undefined> {
    return this.database.db.query.shiftTemplates.findFirst({
      where: and(
        eq(shiftTemplates.id, id),
        eq(shiftTemplates.salonId, salonId),
        isNull(shiftTemplates.deletedAt),
      ),
    });
  }

  listForSalon(salonId: string): Promise<ShiftTemplateRow[]> {
    return this.database.db.query.shiftTemplates.findMany({
      where: and(
        eq(shiftTemplates.salonId, salonId),
        isNull(shiftTemplates.deletedAt),
      ),
    });
  }

  /** Every template across salons — system scope only (the roster job). */
  listAll(): Promise<ShiftTemplateRow[]> {
    return this.database.db.query.shiftTemplates.findMany({
      where: isNull(shiftTemplates.deletedAt),
    });
  }

  async create(input: {
    salonId: string;
    stylistId: string;
    branchId: string;
    name: string;
    chairId?: string | null;
    pattern: PatternEntry[];
  }): Promise<ShiftTemplateRow> {
    const [row] = await this.database.db
      .insert(shiftTemplates)
      .values({ id: uuidv7(), ...input, chairId: input.chairId ?? null })
      .returning();
    return row;
  }
}
