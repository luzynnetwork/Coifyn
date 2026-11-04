import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull, lt } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { stylistTimeOff } from '../../persistence/schema/index.js';

export type TimeOffRow = typeof stylistTimeOff.$inferSelect;
export type TimeOffStatus = 'requested' | 'approved' | 'denied';

@Injectable()
export class TimeOffRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<TimeOffRow | undefined> {
    return this.database.db.query.stylistTimeOff.findFirst({
      where: and(
        eq(stylistTimeOff.id, id),
        eq(stylistTimeOff.salonId, salonId),
        isNull(stylistTimeOff.deletedAt),
      ),
    });
  }

  list(salonId: string, branchId?: string, status?: TimeOffStatus) {
    return this.database.db.query.stylistTimeOff.findMany({
      where: and(
        eq(stylistTimeOff.salonId, salonId),
        isNull(stylistTimeOff.deletedAt),
        branchId ? eq(stylistTimeOff.branchId, branchId) : undefined,
        status ? eq(stylistTimeOff.status, status) : undefined,
      ),
      orderBy: desc(stylistTimeOff.fromAt),
      limit: 200,
    });
  }

  /** Approved time off for a stylist overlapping [from, to). */
  approvedOverlapping(salonId: string, stylistId: string, from: Date, to: Date) {
    return this.database.db.query.stylistTimeOff.findMany({
      where: and(
        eq(stylistTimeOff.salonId, salonId),
        eq(stylistTimeOff.stylistId, stylistId),
        eq(stylistTimeOff.status, 'approved'),
        lt(stylistTimeOff.fromAt, to),
        gt(stylistTimeOff.toAt, from),
        isNull(stylistTimeOff.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    stylistId: string;
    branchId: string;
    fromAt: Date;
    toAt: Date;
    reason: string | null;
  }): Promise<TimeOffRow> {
    const [row] = await this.database.db
      .insert(stylistTimeOff)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async decide(
    salonId: string,
    id: string,
    status: 'approved' | 'denied',
    decidedBy: string,
  ): Promise<TimeOffRow | undefined> {
    const [row] = await this.database.db
      .update(stylistTimeOff)
      .set({ status, decidedBy })
      .where(and(eq(stylistTimeOff.id, id), eq(stylistTimeOff.salonId, salonId)))
      .returning();
    return row;
  }
}
