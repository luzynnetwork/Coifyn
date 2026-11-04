import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { cutRecordPhotos } from '../../persistence/schema/index.js';

export type CutRecordPhotoRow = typeof cutRecordPhotos.$inferSelect;

@Injectable()
export class CutRecordPhotosRepo {
  constructor(private readonly database: DatabaseService) {}

  listForRecord(salonId: string, cutRecordId: string) {
    return this.database.db.query.cutRecordPhotos.findMany({
      where: and(
        eq(cutRecordPhotos.salonId, salonId),
        eq(cutRecordPhotos.cutRecordId, cutRecordId),
        isNull(cutRecordPhotos.deletedAt),
      ),
    });
  }

  findById(salonId: string, id: string) {
    return this.database.db.query.cutRecordPhotos.findFirst({
      where: and(
        eq(cutRecordPhotos.id, id),
        eq(cutRecordPhotos.salonId, salonId),
        isNull(cutRecordPhotos.deletedAt),
      ),
    });
  }

  async create(input: {
    salonId: string;
    cutRecordId: string;
    objectKey: string;
    angle: string;
    isVerified: boolean;
  }): Promise<CutRecordPhotoRow> {
    const [row] = await this.database.db
      .insert(cutRecordPhotos)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  async softDelete(salonId: string, id: string): Promise<void> {
    await this.database.db
      .update(cutRecordPhotos)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(cutRecordPhotos.id, id), eq(cutRecordPhotos.salonId, salonId)),
      );
  }
}
