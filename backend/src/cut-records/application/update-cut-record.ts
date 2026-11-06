import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { CutRecordsRepo } from '../data/cut-records.repo.js';
import type { UpdateCutRecordDto } from '../dto/cut-record.dto.js';

@Injectable()
export class UpdateCutRecord {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly records: CutRecordsRepo,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, id: string, dto: UpdateCutRecordDto) {
    return this.scope.run(user, async (salonId) => {
      const record = await this.records.findById(salonId, id);
      if (!record) throw new NotFoundException('Cut record not found.');
      const stylist = await this.stylists.findById(salonId, record.stylistId);
      await this.authorize.check(user, 'cutrecord:manage', {
        salonId,
        branchId: stylist?.branchId,
      });

      const updated = await this.records.update(salonId, id, { ...dto });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'cut_record.updated',
        targetType: 'cut_record',
        targetId: id,
        after: dto,
      });
      return updated ?? record;
    });
  }
}
