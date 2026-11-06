import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { ShiftsRepo } from '../data/shifts.repo.js';
import { TimeOffRepo } from '../data/time-off.repo.js';

const MAX_RANGE_MS = 62 * 24 * 3600 * 1000;

/** A branch's shifts and approved time off between two local dates. */
@Injectable()
export class ListRoster {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly salons: SalonsRepo,
    private readonly shifts: ShiftsRepo,
    private readonly timeOff: TimeOffRepo,
  ) {}

  execute(user: AuthUser, branchId: string, fromDate: string, toDate: string) {
    return this.scope.run(user, async (salonId) => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'roster:view', { salonId, branchId });

      const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      const from = dayBoundsUtc(fromDate, tz).from;
      const to = dayBoundsUtc(toDate, tz).to;
      if (!(from < to) || to.getTime() - from.getTime() > MAX_RANGE_MS) {
        throw new BadRequestException('Range must be 1–62 days.');
      }

      const shifts = await this.shifts.listForBranch(salonId, branchId, from, to);
      const timeOff = (await this.timeOff.list(salonId, branchId, 'approved')).filter(
        (t) => t.fromAt < to && t.toAt > from,
      );
      return { shifts, timeOff };
    });
  }
}
