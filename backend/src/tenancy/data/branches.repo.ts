import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { branches } from '../../persistence/schema/index.js';

export type BranchRow = typeof branches.$inferSelect;

@Injectable()
export class BranchesRepo {
  constructor(private readonly database: DatabaseService) {}

  listForSalon(salonId: string): Promise<BranchRow[]> {
    return this.database.db.query.branches.findMany({
      where: and(eq(branches.salonId, salonId), isNull(branches.deletedAt)),
    });
  }

  findById(salonId: string, id: string): Promise<BranchRow | undefined> {
    return this.database.db.query.branches.findFirst({
      where: and(
        eq(branches.id, id),
        eq(branches.salonId, salonId),
        isNull(branches.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    name: string;
    address?: unknown;
    hours?: unknown;
  }): Promise<BranchRow> {
    const [row] = await this.database.db
      .insert(branches)
      .values({
        id: uuidv7(),
        salonId: input.salonId,
        name: input.name,
        address: input.address ?? {},
        hours: input.hours ?? {},
      })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<Pick<BranchRow, 'name' | 'address' | 'hours' | 'isActive'>>,
  ): Promise<BranchRow | undefined> {
    const [row] = await this.database.db
      .update(branches)
      .set(patch)
      .where(and(eq(branches.id, id), eq(branches.salonId, salonId)))
      .returning();
    return row;
  }

  async softDelete(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(branches)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(branches.id, id), eq(branches.salonId, salonId)));
  }

  async countActive(salonId: string): Promise<number> {
    const rows = await this.listForSalon(salonId);
    return rows.length;
  }
}
