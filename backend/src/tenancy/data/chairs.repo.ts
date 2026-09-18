import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { chairs } from '../../persistence/schema/index.js';

export type ChairRow = typeof chairs.$inferSelect;

@Injectable()
export class ChairsRepo {
  constructor(private readonly database: DatabaseService) {}

  listForBranch(salonId: string, branchId: string): Promise<ChairRow[]> {
    return this.database.db.query.chairs.findMany({
      where: and(
        eq(chairs.salonId, salonId),
        eq(chairs.branchId, branchId),
        isNull(chairs.deletedAt),
      ),
    });
  }

  findById(salonId: string, id: string): Promise<ChairRow | undefined> {
    return this.database.db.query.chairs.findFirst({
      where: and(
        eq(chairs.id, id),
        eq(chairs.salonId, salonId),
        isNull(chairs.deletedAt),
      ),
    });
  }

  findByLabel(
    salonId: string,
    branchId: string,
    label: string,
  ): Promise<ChairRow | undefined> {
    return this.database.db.query.chairs.findFirst({
      where: and(
        eq(chairs.salonId, salonId),
        eq(chairs.branchId, branchId),
        eq(chairs.label, label),
        isNull(chairs.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    branchId: string;
    label: string;
  }): Promise<ChairRow> {
    const [row] = await this.database.db
      .insert(chairs)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<Pick<ChairRow, 'label' | 'isActive'>>,
  ): Promise<ChairRow | undefined> {
    const [row] = await this.database.db
      .update(chairs)
      .set(patch)
      .where(and(eq(chairs.id, id), eq(chairs.salonId, salonId)))
      .returning();
    return row;
  }

  async softDelete(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(chairs)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(chairs.id, id), eq(chairs.salonId, salonId)));
  }
}
