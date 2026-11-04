import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { SlotFinder } from './slot-finder.js';

/** Open slots for a booking: shift − appointments − holds − approved time off. */
@Injectable()
export class GetSlots {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly finder: SlotFinder,
  ) {}

  execute(user: AuthUser, stylistId: string, serviceIds: string[], date: string) {
    return this.scope.run(user, async (salonId) => {
      const stylist = await this.stylists.findById(salonId, stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      await this.authorize.check(user, 'appointment:view', {
        salonId,
        branchId: stylist.branchId,
      });
      const slots = await this.finder.find({ salonId, stylistId, serviceIds, date });
      return slots.map((s) => ({
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
      }));
    });
  }
}
