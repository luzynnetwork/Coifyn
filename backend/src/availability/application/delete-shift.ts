import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { ShiftsRepo } from '../data/shifts.repo.js';

@Injectable()
export class DeleteShift {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly shifts: ShiftsRepo,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, id: string) {
    return this.scope.run(user, async (salonId) => {
      const shift = await this.shifts.findById(salonId, id);
      if (!shift) throw new NotFoundException('Shift not found.');
      await this.authorize.check(user, 'roster:manage', {
        salonId,
        branchId: shift.branchId,
      });
      await this.shifts.softDelete(salonId, id);
      await this.audit.write({
        salonId,
        actor: user,
        action: 'shift.deleted',
        targetType: 'stylist_shift',
        targetId: id,
        before: { startAt: shift.startAt, endAt: shift.endAt },
      });
      return { deleted: true };
    });
  }
}
