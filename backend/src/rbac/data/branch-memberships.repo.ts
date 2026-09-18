import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { branchMemberships } from '../../persistence/schema/index.js';

@Injectable()
export class BranchMembershipsRepo {
  constructor(private readonly database: DatabaseService) {}

  async branchIdsForUser(
    salonId: string,
    userId: string,
  ): Promise<string[]> {
    const rows = await this.database.db
      .select({ branchId: branchMemberships.branchId })
      .from(branchMemberships)
      .where(
        and(
          eq(branchMemberships.salonId, salonId),
          eq(branchMemberships.userId, userId),
        ),
      );
    return rows.map((r) => r.branchId);
  }

  async isMemberOfBranch(
    salonId: string,
    userId: string,
    branchId: string,
  ): Promise<boolean> {
    const [row] = await this.database.db
      .select({ id: branchMemberships.id })
      .from(branchMemberships)
      .where(
        and(
          eq(branchMemberships.salonId, salonId),
          eq(branchMemberships.userId, userId),
          eq(branchMemberships.branchId, branchId),
        ),
      );
    return Boolean(row);
  }

  async add(input: {
    salonId: string;
    userId: string;
    branchId: string;
  }): Promise<void> {
    await this.database.db
      .insert(branchMemberships)
      .values({ id: uuidv7(), ...input })
      .onConflictDoNothing();
  }

  async replaceForUser(
    salonId: string,
    userId: string,
    branchIds: string[],
  ): Promise<void> {
    await this.database.db
      .delete(branchMemberships)
      .where(
        and(
          eq(branchMemberships.salonId, salonId),
          eq(branchMemberships.userId, userId),
        ),
      );
    if (branchIds.length === 0) return;
    await this.database.db.insert(branchMemberships).values(
      branchIds.map((branchId) => ({
        id: uuidv7(),
        salonId,
        userId,
        branchId,
      })),
    );
  }
}
