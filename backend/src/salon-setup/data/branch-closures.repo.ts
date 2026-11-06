import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { branchClosures } from '../../persistence/schema/index.js';

export type BranchClosureRow = typeof branchClosures.$inferSelect;

@Injectable()
export class BranchClosuresRepo {
  constructor(private readonly database: DatabaseService) {}

  listForBranch(
    salonId: string,
    branchId: string,
  ): Promise<BranchClosureRow[]> {
    return this.database.db.query.branchClosures.findMany({
      where: and(
        eq(branchClosures.salonId, salonId),
        eq(branchClosures.branchId, branchId),
        isNull(branchClosures.deletedAt),
      ),
      orderBy: asc(branchClosures.startsOn),
    });
  }

  findById(
    salonId: string,
    id: string,
  ): Promise<BranchClosureRow | undefined> {
    return this.database.db.query.branchClosures.findFirst({
      where: and(
        eq(branchClosures.id, id),
        eq(branchClosures.salonId, salonId),
        isNull(branchClosures.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    branchId: string;
    startsOn: string;
    endsOn: string;
    reason: string;
  }): Promise<BranchClosureRow> {
    const [row] = await this.database.db
      .insert(branchClosures)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async softDelete(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(branchClosures)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(branchClosures.id, id), eq(branchClosures.salonId, salonId)),
      );
  }
}
