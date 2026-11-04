import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { dayBoundsUtc } from '../../common/day-bounds.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { ReportsRepo } from '../../reports/data/reports.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { SalonsRepo } from '../../tenancy/data/salons.repo.js';
import { DashboardRepo } from '../data/dashboard.repo.js';
import {
  RANGE_DAYS,
  changePct,
  previousRange,
  ratio,
  type DashboardRange,
  type Range,
} from '../domain/kpi.js';

interface Period {
  revenueMinor: number;
  paidTickets: number;
  averageTicketMinor: number | null;
  bookings: number;
  walkIns: number;
  noShowRate: number | null;
  chairUtilization: number | null;
  rebookingRate: number | null;
  gapMinutes: number;
}

const KPI_DEFS = {
  bookings: {
    label: 'Bookings',
    definition: 'Appointments starting in the period that are not cancelled.',
    source: 'appointment (status ≠ cancelled)',
  },
  walkIns: {
    label: 'Walk-ins',
    definition: 'Queue entries that joined the walk-in line in the period.',
    source: 'queue_entry.joined_at',
  },
  noShowRate: {
    label: 'No-show rate',
    definition: 'No-shows ÷ (completed + no-show) appointments in the period.',
    source: 'appointment (status completed | no_show)',
  },
  chairUtilization: {
    label: 'Chair utilization',
    definition: 'Booked minutes ÷ rostered shift minutes in the period.',
    source: 'appointment minutes ÷ stylist_shift minutes',
  },
  revenueMinor: {
    label: 'Revenue',
    definition: 'Total of tickets paid in the period (same figure as the day report).',
    source: 'ticket (status = paid, paid_at in period)',
  },
  averageTicketMinor: {
    label: 'Average ticket',
    definition: 'Revenue ÷ number of paid tickets.',
    source: 'ticket (status = paid)',
  },
  rebookingRate: {
    label: 'Rebooking rate',
    definition:
      'Customers with a completed visit in the period who have a later appointment ÷ customers with a completed visit.',
    source: 'appointment (customer_id, status completed)',
  },
} as const;

/** Today's numbers for a branch, each KPI carrying its definition, the
 *  comparison value, where it comes from and when it was computed. */
@Injectable()
export class GetDashboard {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly salons: SalonsRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly repo: DashboardRepo,
    private readonly reports: ReportsRepo,
  ) {}

  private async period(salonId: string, branchId: string, r: Range): Promise<Period> {
    const [c, paid] = await Promise.all([
      this.repo.counts(salonId, branchId, r),
      this.reports.paidTicketsBySource(salonId, branchId, r),
    ]);
    const revenueMinor = paid.reduce((s, p) => s + p.totalMinor, 0);
    const paidTickets = paid.reduce((s, p) => s + p.count, 0);
    return {
      revenueMinor,
      paidTickets,
      averageTicketMinor: paidTickets > 0 ? Math.round(revenueMinor / paidTickets) : null,
      bookings: c.bookings,
      walkIns: c.walkIns,
      noShowRate: ratio(c.noShows, c.closedAppointments),
      chairUtilization: ratio(c.bookedMinutes, c.rosteredMinutes),
      rebookingRate: ratio(c.rebookedCustomers, c.completedCustomers),
      gapMinutes: Math.max(0, Math.round(c.rosteredMinutes - c.bookedMinutes)),
    };
  }

  execute(
    user: AuthUser,
    branchId: string,
    rangeName: DashboardRange,
    compare: boolean,
    today?: string,
  ) {
    return this.scope.run(user, async (salonId) => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'dashboard:view', { salonId, branchId });

      const tz = (await this.salons.findById(salonId))?.timezone ?? 'UTC';
      const localToday =
        today ??
        new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
      const todayBounds = dayBoundsUtc(localToday, tz);
      const days = RANGE_DAYS[rangeName];
      const range: Range = {
        from: new Date(todayBounds.to.getTime() - days * 86400000),
        to: todayBounds.to,
      };

      const current = await this.period(salonId, branchId, range);
      const previous = compare
        ? await this.period(salonId, branchId, previousRange(range))
        : null;
      const refreshedAt = new Date().toISOString();

      const kpi = <K extends keyof typeof KPI_DEFS>(key: K) => {
        const value = current[key as keyof Period] as number | null;
        const prev = previous ? (previous[key as keyof Period] as number | null) : null;
        return {
          key,
          ...KPI_DEFS[key],
          value,
          comparison: previous ? { value: prev, changePct: changePct(value, prev) } : null,
          refreshedAt,
        };
      };

      const [booked, rostered, openDisruptions] = await Promise.all([
        this.repo.stylistBookedMinutes(salonId, branchId, range),
        this.repo.stylistRosteredMinutes(salonId, branchId, range),
        this.repo.openDisruptions(salonId, branchId),
      ]);
      const stylists = (await this.stylists.listForSalon(salonId))
        .filter((s) => s.branchId === branchId)
        .map((s) => {
          const b = booked.find((x) => x.stylist_id === s.id)?.minutes ?? 0;
          const r = rostered.find((x) => x.stylist_id === s.id)?.minutes ?? 0;
          return {
            id: s.id,
            displayName: s.displayName,
            status: s.status,
            bookedMinutes: Math.round(b),
            rosteredMinutes: Math.round(r),
            utilization: ratio(b, r),
          };
        });

      return {
        branchId,
        range: rangeName,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        refreshedAt,
        kpis: [
          kpi('bookings'),
          kpi('walkIns'),
          kpi('noShowRate'),
          kpi('chairUtilization'),
          kpi('revenueMinor'),
          kpi('averageTicketMinor'),
          kpi('rebookingRate'),
        ],
        stylists,
        lowCoverGapMinutes: current.gapMinutes,
        unresolvedDisruptions: openDisruptions,
      };
    });
  }
}
