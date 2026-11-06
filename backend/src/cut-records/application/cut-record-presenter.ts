import { Inject, Injectable } from '@nestjs/common';
import { OBJECT_STORE, type ObjectStore } from '../../providers/object-store.js';
import { CutRecordPhotosRepo } from '../data/cut-record-photos.repo.js';
import type { CutRecordRow } from '../data/cut-records.repo.js';

/** Attaches each record's photos with short-lived download URLs. */
@Injectable()
export class CutRecordPresenter {
  constructor(
    private readonly photos: CutRecordPhotosRepo,
    @Inject(OBJECT_STORE) private readonly store: ObjectStore,
  ) {}

  async present(salonId: string, records: CutRecordRow[]) {
    const out = [];
    for (const record of records) {
      const photos = await this.photos.listForRecord(salonId, record.id);
      out.push({
        ...record,
        photos: await Promise.all(
          photos.map(async (p) => ({
            id: p.id,
            angle: p.angle,
            isVerified: p.isVerified,
            url: await this.store.presignDownload(p.objectKey, 900).catch(() => null),
          })),
        ),
      });
    }
    return out;
  }
}
