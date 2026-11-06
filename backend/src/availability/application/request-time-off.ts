import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { TimeOffRepo } from '../data/time-off.repo.js';
import type { RequestTimeOffDto } from '../dto/availability.dto.js';

@Injectable()
export class RequestTimeOff {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly timeOff: TimeOffRepo,
    private readonly events: EventBus,
  ) {}

  execute(user: AuthUser, dto: RequestTimeOffDto) {
    const fromAt = new Date(dto.fromAt);
    const toAt = new Date(dto.toAt);
    if (!(fromAt < toAt)) {
      throw new BadRequestException('toAt must be after fromAt.');
    }
    return this.scope.run(user, async (salonId) => {
      const stylist = await this.stylists.findById(salonId, dto.stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      const ctx = { salonId, branchId: stylist.branchId };
      // A manager may file for anyone; a stylist only for themself.
      if (!(await this.authorize.can(user, 'roster:manage', ctx))) {
        await this.authorize.check(user, 'timeoff:request', ctx);
        if (stylist.userId !== user.id) {
          throw new BadRequestException('You can only request your own time off.');
        }
      }

      const row = await this.timeOff.create({
        salonId,
        stylistId: stylist.id,
        branchId: stylist.branchId,
        fromAt,
        toAt,
        reason: dto.reason ?? null,
      });
      await this.events.emit({
        aggregateType: 'stylist_time_off',
        aggregateId: row.id,
        type: 'TimeOffRequested',
        salonId,
        payload: { timeOffId: row.id, stylistId: stylist.id },
      });
      return row;
    });
  }
}
