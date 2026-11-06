import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import type { AuthUser } from '../../auth/auth-user.js';
import { EventBus } from '../../events/event-bus.js';
import { OBJECT_STORE, type ObjectStore } from '../../providers/object-store.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { CutRecordPhotosRepo } from '../data/cut-record-photos.repo.js';
import { CutRecordsRepo } from '../data/cut-records.repo.js';
import type { AddPhotoDto } from '../dto/cut-record.dto.js';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Registers a photo and returns a presigned upload URL for the client to PUT
 *  the file to. Photos added through the console are taken at the salon, so
 *  they are `isVerified` (customer-submitted photos arrive in Phase 4). */
@Injectable()
export class AddCutRecordPhoto {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly records: CutRecordsRepo,
    private readonly photos: CutRecordPhotosRepo,
    private readonly events: EventBus,
    @Inject(OBJECT_STORE) private readonly store: ObjectStore,
  ) {}

  execute(user: AuthUser, recordId: string, dto: AddPhotoDto) {
    return this.scope.run(user, async (salonId) => {
      const record = await this.records.findById(salonId, recordId);
      if (!record) throw new NotFoundException('Cut record not found.');
      const stylist = await this.stylists.findById(salonId, record.stylistId);
      await this.authorize.check(user, 'cutrecord:manage', {
        salonId,
        branchId: stylist?.branchId,
      });

      const key = `salons/${salonId}/cut-records/${recordId}/${uuidv7()}.${EXT[dto.contentType]}`;
      const photo = await this.photos.create({
        salonId,
        cutRecordId: recordId,
        objectKey: key,
        angle: dto.angle,
        isVerified: true,
      });
      const upload = await this.store.presignUpload(key, dto.contentType, 600);
      await this.events.emit({
        aggregateType: 'cut_record',
        aggregateId: recordId,
        type: 'CutRecordPhotoAdded',
        salonId,
        payload: { cutRecordId: recordId, photoId: photo.id },
      });
      return { photo, uploadUrl: upload.url };
    });
  }
}
