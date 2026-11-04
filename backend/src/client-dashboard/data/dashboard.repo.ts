import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import type { Range } from '../domain/kpi.js';

export interface PeriodCounts {
  bookings: number;
  noShows: number;
  closedAppointments: number;
  bookedMinutes: number;
  rosteredMinutes: number;
  walkIns: number;
  completedCustomers: number;
  rebookedCustomers: number;
}

/** Raw counts straight from the source tables for one branch and period. */
@Injectable()
export class DashboardRepo {
  constructor(private readonly database: DatabaseService) {}

  async counts(salonId: string, branchId: string, r: Range): Promise<PeriodCounts> {
    const db = this.database.db;
    const [appt] = await db.execute<{
      bookings: number;
      no_shows: number;
      closed: number;
      booked_minutes: number;
    }>(sql`
      select
        count(*) filter (where status <> 'cancelled')::int as bookings,
        count(*) filter (where status = 'no_show')::int as no_shows,
        count(*) filter (where status in ('completed', 'no_show'))::int as closed,
        coalesce(sum(extract(epoch from (end_at - start_at)) / 60)
          filter (where status not in ('cancelled', 'no_show')), 0)::float8 as booked_minutes
      from appointment
      where salon_id = ${salonId} and branch_id = ${branchId}
        and deleted_at is null and start_at >= ${r.from} and start_at < ${r.to}`);

    const [shift] = await db.execute<{ rostered: number }>(sql`
      select coalesce(sum(extract(epoch from (end_at - start_at)) / 60), 0)::float8 as rostered
      from stylist_shift
      where salon_id = ${salonId} and branch_id = ${branchId}
        and deleted_at is null and start_at >= ${r.from} and start_at < ${r.to}`);

    const [queue] = await db.execute<{ walk_ins: number }>(sql`
      select count(*)::int as walk_ins from queue_entry
      where salon_id = ${salonId} and branch_id = ${branchId}
        and deleted_at is null and joined_at >= ${r.from} and joined_at < ${r.to}`);

    const [rebook] = await db.execute<{ customers: number; rebooked: number }>(sql`
      select
        count(distinct a.customer_id)::int as customers,
        count(distinct a.customer_id) filter (where exists (
          select 1 from appointment b
          where b.customer_id = a.customer_id and b.id <> a.id
            and b.start_at > a.start_at and b.deleted_at is null
            and b.status in ('booked', 'arrived', 'in_service', 'completed')
        ))::int as rebooked
      from appointment a
      where a.salon_id = ${salonId} and a.branch_id = ${branchId}
        and a.deleted_at is null and a.status = 'completed'
        and a.customer_id is not null
        and a.start_at >= ${r.from} and a.start_at < ${r.to}`);

    return {
      bookings: appt?.bookings ?? 0,
      noShows: appt?.no_shows ?? 0,
      closedAppointments: appt?.closed ?? 0,
      bookedMinutes: appt?.booked_minutes ?? 0,
      rosteredMinutes: shift?.rostered ?? 0,
      walkIns: queue?.walk_ins ?? 0,
      completedCustomers: rebook?.customers ?? 0,
      rebookedCustomers: rebook?.rebooked ?? 0,
    };
  }

  /** Booked minutes per stylist within the period (for utilization). */
  stylistBookedMinutes(salonId: string, branchId: string, r: Range) {
    return this.database.db.execute<{ stylist_id: string; minutes: number }>(sql`
      select stylist_id,
             coalesce(sum(extract(epoch from (end_at - start_at)) / 60), 0)::float8 as minutes
      from appointment
      where salon_id = ${salonId} and branch_id = ${branchId} and deleted_at is null
        and status not in ('cancelled', 'no_show')
        and start_at >= ${r.from} and start_at < ${r.to}
      group by stylist_id`);
  }

  stylistRosteredMinutes(salonId: string, branchId: string, r: Range) {
    return this.database.db.execute<{ stylist_id: string; minutes: number }>(sql`
      select stylist_id,
             coalesce(sum(extract(epoch from (end_at - start_at)) / 60), 0)::float8 as minutes
      from stylist_shift
      where salon_id = ${salonId} and branch_id = ${branchId} and deleted_at is null
        and start_at >= ${r.from} and start_at < ${r.to}
      group by stylist_id`);
  }

  async openDisruptions(salonId: string, branchId: string): Promise<number> {
    const [row] = await this.database.db.execute<{ n: number }>(sql`
      select count(*)::int as n from disruption
      where salon_id = ${salonId} and branch_id = ${branchId}
        and deleted_at is null and status = 'open'`);
    return row?.n ?? 0;
  }
}
