import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { ShiftsRepo } from '../data/shifts.repo.js';
import type { UpdateShiftDto } from '../dto/availability.dto.js';

@Injectable()
export class UpdateShift {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly shifts: ShiftsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, id: string, dto: UpdateShiftDto) {
    return this.scope.run(user, async (salonId) => {
      const shift = await this.shifts.findById(salonId, id);
      if (!shift) throw new NotFoundException('Shift not found.');
      await this.authorize.check(user, 'roster:manage', {
        salonId,
        branchId: shift.branchId,
      });

      const startAt = dto.startAt ? new Date(dto.startAt) : shift.startAt;
      const endAt = dto.endAt ? new Date(dto.endAt) : shift.endAt;
      if (!(startAt < endAt)) {
        throw new BadRequestException('endAt must be after startAt.');
      }
      if (
        await this.shifts.findOverlap(salonId, shift.stylistId, startAt, endAt, id)
      ) {
        throw new ConflictException('That stylist already has a shift then.');
      }

      const updated = await this.shifts.update(salonId, id, {
        startAt,
        endAt,
        ...(dto.chairId && { chairId: dto.chairId }),
        kind: 'override',
      });
      await this.events.emit({
        aggregateType: 'stylist_shift',
        aggregateId: id,
        type: 'ShiftPublished',
        salonId,
        payload: { shiftId: id, stylistId: shift.stylistId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'shift.updated',
        targetType: 'stylist_shift',
        targetId: id,
        before: { startAt: shift.startAt, endAt: shift.endAt },
        after: { startAt, endAt },
      });
      return updated ?? shift;
    });
  }
}
