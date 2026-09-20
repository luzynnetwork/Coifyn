import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { ReportsRepo } from '../data/reports.repo.js';
import { buildDayReport } from '../domain/build-day-report.js';

@Injectable()
export class GetDayReport {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
    private readonly branches: BranchesRepo,
    private readonly reports: ReportsRepo,
  ) {}

  async execute(user: AuthUser, branchId: string, date: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'report:view', { salonId, branchId });

      const timezone = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      const range = dayBoundsUtc(date, timezone);

      const [paid, voided, refunded, methods] = await Promise.all([
        this.reports.paidTicketsBySource(salonId, branchId, range),
        this.reports.voided(salonId, branchId, range),
        this.reports.refunded(salonId, branchId, range),
        this.reports.paymentsByMethod(salonId, branchId, range),
      ]);

      return {
        branchId,
        date,
        timezone,
        ...buildDayReport(paid, voided, refunded, methods),
      };
    });
  }
}
