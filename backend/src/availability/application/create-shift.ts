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
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { ShiftsRepo } from '../data/shifts.repo.js';
import type { CreateShiftDto } from '../dto/availability.dto.js';

@Injectable()
export class CreateShift {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly shifts: ShiftsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, dto: CreateShiftDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (!(startAt < endAt)) {
      throw new BadRequestException('endAt must be after startAt.');
    }
    return this.scope.run(user, async (salonId) => {
      const stylist = await this.stylists.findById(salonId, dto.stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      await this.authorize.check(user, 'roster:manage', {
        salonId,
        branchId: stylist.branchId,
      });
      if (await this.shifts.findOverlap(salonId, stylist.id, startAt, endAt)) {
        throw new ConflictException('That stylist already has a shift then.');
      }

      const shift = await this.shifts.create({
        salonId,
        stylistId: stylist.id,
        branchId: stylist.branchId,
        startAt,
        endAt,
        chairId: dto.chairId,
        kind: dto.kind,
      });
      await this.events.emit({
        aggregateType: 'stylist_shift',
        aggregateId: shift.id,
        type: 'ShiftPublished',
        salonId,
        payload: { shiftId: shift.id, stylistId: stylist.id },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'shift.created',
        targetType: 'stylist_shift',
        targetId: shift.id,
        after: { stylistId: stylist.id, startAt: dto.startAt, endAt: dto.endAt },
      });
      return shift;
    });
  }
}
