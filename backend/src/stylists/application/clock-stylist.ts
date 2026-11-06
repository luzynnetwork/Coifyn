import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';
import { StylistPresence } from './stylist-presence.js';

/** `clock-in` makes a stylist `available`; `clock-out` puts them `off_shift`. */
@Injectable()
export class ClockStylist {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly presence: StylistPresence,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, direction: 'in' | 'out') {
    const change = await this.scope.run(user, async (salonId) => {
      const stylist = await this.stylists.findById(salonId, id);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      await this.authorize.check(user, 'stylist:status', {
        salonId,
        branchId: stylist.branchId,
      });

      const result = await this.presence.set(
        salonId,
        id,
        direction === 'in' ? 'available' : 'off_shift',
        user.id,
        direction === 'in' ? 'clock-in' : 'clock-out',
      );
      await this.audit.write({
        salonId,
        actor: user,
        action: direction === 'in' ? 'stylist.clock_in' : 'stylist.clock_out',
        targetType: 'stylist_profile',
        targetId: id,
        before: { status: stylist.status },
      });
      return result;
    });
    this.presence.announce(change);
    return { stylistId: id, status: change?.status };
  }
}
