import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { queueEntries } from '../../persistence/schema/index.js';

export type QueueEntryRow = typeof queueEntries.$inferSelect;
export type QueueStatus =
  | 'waiting'
  | 'assigned'
  | 'in_service'
  | 'done'
  | 'left';

export type QueueEntryPatch = Partial<
  Pick<
    QueueEntryRow,
    | 'status'
    | 'assignedStylistId'
    | 'assignedChairId'
    | 'calledAt'
    | 'startedAt'
    | 'completedAt'
    | 'leftReason'
  >
>;

@Injectable()
export class QueueEntriesRepo {
  constructor(private readonly database: DatabaseService) {}

  /** Live entries for a branch (waiting/assigned/in_service), oldest first. */
  listActive(salonId: string, branchId: string): Promise<QueueEntryRow[]> {
    return this.database.db.query.queueEntries.findMany({
      where: and(
        eq(queueEntries.salonId, salonId),
        eq(queueEntries.branchId, branchId),
        inArray(queueEntries.status, ['waiting', 'assigned', 'in_service']),
        isNull(queueEntries.deletedAt),
      ),
      orderBy: asc(queueEntries.joinedAt),
    });
  }

  findById(salonId: string, id: string): Promise<QueueEntryRow | undefined> {
    return this.database.db.query.queueEntries.findFirst({
      where: and(
        eq(queueEntries.id, id),
        eq(queueEntries.salonId, salonId),
        isNull(queueEntries.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    branchId: string;
    customerId: string | null;
    walkInName: string | null;
    requestedStylistId: string | null;
    requestedServiceIds: string[];
  }): Promise<QueueEntryRow> {
    const [row] = await this.database.db
      .insert(queueEntries)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: QueueEntryPatch,
  ): Promise<QueueEntryRow | undefined> {
    const [row] = await this.database.db
      .update(queueEntries)
      .set(patch)
      .where(and(eq(queueEntries.id, id), eq(queueEntries.salonId, salonId)))
      .returning();
    return row;
  }

  /** How many entries are still waiting and joined before `joinedAt`. */
  async countWaitingAhead(
    salonId: string,
    branchId: string,
    joinedAt: Date,
  ): Promise<number> {
    const [row] = await this.database.db
      .select({ n: sql<number>`count(*)::int` })
      .from(queueEntries)
      .where(
        and(
          eq(queueEntries.salonId, salonId),
          eq(queueEntries.branchId, branchId),
          eq(queueEntries.status, 'waiting'),
          lt(queueEntries.joinedAt, joinedAt),
          isNull(queueEntries.deletedAt),
        ),
      );
    return row?.n ?? 0;
  }
}
