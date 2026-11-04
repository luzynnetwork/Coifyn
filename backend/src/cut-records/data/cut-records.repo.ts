import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { cutRecords } from '../../persistence/schema/index.js';

export type CutRecordRow = typeof cutRecords.$inferSelect;
export type CutRecordFields = Partial<
  Pick<
    CutRecordRow,
    | 'serviceIds'
    | 'clipperGuards'
    | 'fadeType'
    | 'partingNotes'
    | 'beardNotes'
    | 'productsUsed'
    | 'freeText'
  >
>;

@Injectable()
export class CutRecordsRepo {
  constructor(private readonly database: DatabaseService) {}

  findById(salonId: string, id: string): Promise<CutRecordRow | undefined> {
    return this.database.db.query.cutRecords.findFirst({
      where: and(
        eq(cutRecords.id, id),
        eq(cutRecords.salonId, salonId),
        isNull(cutRecords.deletedAt),
      ),
    });
  }

  listForCustomer(salonId: string, customerId: string): Promise<CutRecordRow[]> {
    return this.database.db.query.cutRecords.findMany({
      where: and(
        eq(cutRecords.salonId, salonId),
        eq(cutRecords.customerId, customerId),
        isNull(cutRecords.deletedAt),
      ),
      orderBy: desc(cutRecords.createdAt),
      limit: 100,
    });
  }

  latestForCustomer(
    salonId: string,
    customerId: string,
  ): Promise<CutRecordRow | undefined> {
    return this.database.db.query.cutRecords.findFirst({
      where: and(
        eq(cutRecords.salonId, salonId),
        eq(cutRecords.customerId, customerId),
        isNull(cutRecords.deletedAt),
      ),
      orderBy: desc(cutRecords.createdAt),
    });
  }

  async create(
    input: CutRecordFields & {
      salonId: string;
      customerId: string;
      stylistId: string;
      appointmentId?: string | null;
      ticketId?: string | null;
    },
  ): Promise<CutRecordRow> {
    const [row] = await this.database.db
      .insert(cutRecords)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async update(
    salonId: string,
    id: string,
    patch: CutRecordFields,
  ): Promise<CutRecordRow | undefined> {
    const [row] = await this.database.db
      .update(cutRecords)
      .set(patch)
      .where(and(eq(cutRecords.id, id), eq(cutRecords.salonId, salonId)))
      .returning();
    return row;
  }
}
