import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { OBJECT_STORE, type ObjectStore } from '../../providers/object-store.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { CutRecordPhotosRepo } from '../data/cut-record-photos.repo.js';
import { CutRecordsRepo } from '../data/cut-records.repo.js';

@Injectable()
export class DeleteCutRecordPhoto {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly records: CutRecordsRepo,
    private readonly photos: CutRecordPhotosRepo,
    private readonly audit: AuditWriter,
    @Inject(OBJECT_STORE) private readonly store: ObjectStore,
  ) {}

  execute(user: AuthUser, recordId: string, photoId: string) {
    return this.scope.run(user, async (salonId) => {
      const record = await this.records.findById(salonId, recordId);
      const photo = await this.photos.findById(salonId, photoId);
      if (!record || !photo || photo.cutRecordId !== recordId) {
        throw new NotFoundException('Photo not found.');
      }
      const stylist = await this.stylists.findById(salonId, record.stylistId);
      await this.authorize.check(user, 'cutrecord:manage', {
        salonId,
        branchId: stylist?.branchId,
      });

      await this.photos.softDelete(salonId, photoId);
      await this.store.delete(photo.objectKey).catch(() => undefined);
      await this.audit.write({
        salonId,
        actor: user,
        action: 'cut_record.photo_deleted',
        targetType: 'cut_record_photo',
        targetId: photoId,
      });
      return { deleted: true };
    });
  }
}
