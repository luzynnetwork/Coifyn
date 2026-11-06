import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { DisruptionOffersRepo } from '../data/disruption-offers.repo.js';
import { DisruptionsRepo } from '../data/disruptions.repo.js';

/** Disruptions with their offers, so the panel can show the offer tracker. */
@Injectable()
export class ListDisruptions {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly disruptions: DisruptionsRepo,
    private readonly offers: DisruptionOffersRepo,
  ) {}

  execute(user: AuthUser, branchId: string, status?: 'open' | 'resolved') {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'disruption:manage', { salonId, branchId });
      const rows = await this.disruptions.list(salonId, branchId, status);
      const out = [];
      for (const d of rows) {
        out.push({
          ...d,
          offers: await this.offers.listForDisruption(salonId, d.id),
        });
      }
      return out;
    });
  }
}
