import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { branchHours } from '../../persistence/schema/index.js';

export type BranchHoursRow = typeof branchHours.$inferSelect;

export interface WeekdayHoursInput {
  weekday: number;
  isClosed: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  breaks: Array<{ start: string; end: string }>;
}

@Injectable()
export class BranchHoursRepo {
  constructor(private readonly database: DatabaseService) {}

  listForBranch(salonId: string, branchId: string): Promise<BranchHoursRow[]> {
    return this.database.db.query.branchHours.findMany({
      where: and(
        eq(branchHours.salonId, salonId),
        eq(branchHours.branchId, branchId),
      ),
      orderBy: asc(branchHours.weekday),
    });
  }

  /** Upserts all 7 weekday rows in one pass — the caller always sets a full week. */
  async replaceWeek(
    salonId: string,
    branchId: string,
    week: WeekdayHoursInput[],
  ): Promise<BranchHoursRow[]> {
    const rows: BranchHoursRow[] = [];
    for (const day of week) {
      const [row] = await this.database.db
        .insert(branchHours)
        .values({
          id: uuidv7(),
          salonId,
          branchId,
          weekday: day.weekday,
          isClosed: day.isClosed,
          opensAt: day.opensAt ?? null,
          closesAt: day.closesAt ?? null,
          breaks: day.breaks,
        })
        .onConflictDoUpdate({
          target: [branchHours.branchId, branchHours.weekday],
          set: {
            isClosed: day.isClosed,
            opensAt: day.opensAt ?? null,
            closesAt: day.closesAt ?? null,
            breaks: day.breaks,
            updatedAt: new Date(),
          },
        })
        .returning();
      rows.push(row);
    }
    return rows;
  }
}
