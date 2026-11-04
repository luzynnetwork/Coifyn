import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { disruptions } from '../../persistence/schema/index.js';

export type DisruptionRow = typeof disruptions.$inferSelect;
export type DisruptionKind = 'running_late' | 'absent' | 'left_early';

@Injectable()
export class DisruptionsRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<DisruptionRow | undefined> {
    return this.database.db.query.disruptions.findFirst({
      where: and(
        eq(disruptions.id, id),
        eq(disruptions.salonId, salonId),
        isNull(disruptions.deletedAt),
      ),
    });
  }

  list(salonId: string, branchId: string, status?: 'open' | 'resolved') {
    return this.database.db.query.disruptions.findMany({
      where: and(
        eq(disruptions.salonId, salonId),
        eq(disruptions.branchId, branchId),
        isNull(disruptions.deletedAt),
        status ? eq(disruptions.status, status) : undefined,
      ),
      orderBy: desc(disruptions.createdAt),
      limit: 100,
    });
  }

  async create(input: {
    salonId: string;
    branchId: string;
    stylistId: string;
    kind: DisruptionKind;
    minutesLate: number | null;
    windowStart: Date;
    windowEnd: Date;
    createdBy: string;
  }): Promise<DisruptionRow> {
    const [row] = await this.database.db
      .insert(disruptions)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<Pick<DisruptionRow, 'status' | 'notifiedAt'>>,
  ): Promise<DisruptionRow | undefined> {
    const [row] = await this.database.db
      .update(disruptions)
      .set(patch)
      .where(and(eq(disruptions.id, id), eq(disruptions.salonId, salonId)))
      .returning();
    return row;
  }
}
