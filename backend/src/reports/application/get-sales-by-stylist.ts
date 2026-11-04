import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { ReportsRepo } from '../data/reports.repo.js';

/** Revenue, ticket count and service count per stylist for paid tickets in
 *  [from, to]. A line with no stylist is grouped under a null stylistId. */
@Injectable()
export class GetSalesByStylist {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
    private readonly branches: BranchesRepo,
    private readonly reports: ReportsRepo,
  ) {}

  async execute(user: AuthUser, from: string, to: string, branchId?: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (branchId && !(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'report:view', { salonId, branchId });

      const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      const range = {
        from: dayBoundsUtc(from, tz).from,
        to: dayBoundsUtc(to, tz).to,
      };
      return this.reports.salesByStylist(salonId, range, branchId);
    });
  }
}
