import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNull, lt, ne } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { stylistShifts } from '../../persistence/schema/index.js';

export type ShiftRow = typeof stylistShifts.$inferSelect;
export interface NewShift {
  salonId: string;
  stylistId: string;
  branchId: string;
  startAt: Date;
  endAt: Date;
  chairId?: string | null;
  kind?: 'regular' | 'override';
  templateId?: string | null;
}

@Injectable()
export class ShiftsRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<ShiftRow | undefined> {
    return this.database.db.query.stylistShifts.findFirst({
      where: and(
        eq(stylistShifts.id, id),
        eq(stylistShifts.salonId, salonId),
        isNull(stylistShifts.deletedAt),
      ),
    });
  }

  listForBranch(salonId: string, branchId: string, from: Date, to: Date) {
    return this.database.db.query.stylistShifts.findMany({
      where: and(
        eq(stylistShifts.salonId, salonId),
        eq(stylistShifts.branchId, branchId),
        gt(stylistShifts.endAt, from),
        lt(stylistShifts.startAt, to),
        isNull(stylistShifts.deletedAt),
      ),
      orderBy: asc(stylistShifts.startAt),
    });
  }

  listForStylist(salonId: string, stylistId: string, from: Date, to: Date) {
    return this.database.db.query.stylistShifts.findMany({
      where: and(
        eq(stylistShifts.salonId, salonId),
        eq(stylistShifts.stylistId, stylistId),
        gt(stylistShifts.endAt, from),
        lt(stylistShifts.startAt, to),
        isNull(stylistShifts.deletedAt),
      ),
      orderBy: asc(stylistShifts.startAt),
    });
  }

  /** Another shift of the same stylist overlapping [startAt, endAt). */
  findOverlap(
    salonId: string,
    stylistId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<ShiftRow | undefined> {
    return this.database.db.query.stylistShifts.findFirst({
      where: and(
        eq(stylistShifts.salonId, salonId),
        eq(stylistShifts.stylistId, stylistId),
        lt(stylistShifts.startAt, endAt),
        gt(stylistShifts.endAt, startAt),
        isNull(stylistShifts.deletedAt),
        excludeId ? ne(stylistShifts.id, excludeId) : undefined,
      ),
    });
  }

  async create(input: NewShift): Promise<ShiftRow> {
    const [row] = await this.database.db
      .insert(stylistShifts)
      .values({
        id: uuidv7(),
        ...input,
        chairId: input.chairId ?? null,
        kind: input.kind ?? 'regular',
        templateId: input.templateId ?? null,
      })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: Partial<Pick<ShiftRow, 'startAt' | 'endAt' | 'chairId' | 'kind'>>,
  ): Promise<ShiftRow | undefined> {
    const [row] = await this.database.db
      .update(stylistShifts)
      .set(patch)
      .where(and(eq(stylistShifts.id, id), eq(stylistShifts.salonId, salonId)))
      .returning();
    return row;
  }

  async softDelete(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(stylistShifts)
      .set({ deletedAt: new Date() })
      .where(and(eq(stylistShifts.id, id), eq(stylistShifts.salonId, salonId)));
  }
}
