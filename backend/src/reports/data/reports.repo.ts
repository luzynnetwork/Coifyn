import { Injectable } from '@nestjs/common';
import { and, eq, gte, isNull, lt, sql, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import {
  payments,
  refunds,
  registerSessions,
  stylistProfiles,
  ticketLines,
  tickets,
} from '../../persistence/schema/index.js';

/** Sum of an integer column as a plain number (exact below 2^53 minor units). */
const sumOf = (col: unknown) =>
  sql<number>`coalesce(sum(${col}), 0)::float8`;
const countAll = sql<number>`count(*)::int`;

export interface Range {
  from: Date;
  to: Date;
}

/**
 * Read-only aggregates over the source tables. Nothing here is cached or
 * denormalised: every figure is computed from the same ticket, payment and
 * refund rows a user can open, so a report can only disagree with them if the
 * query is wrong — which the reconciliation e2e test checks.
 */
@Injectable()
export class ReportsRepo {
  constructor(private readonly database: DatabaseService) {}

  /** Paid tickets settled in the range, per source. */
  paidTicketsBySource(salonId: string, branchId: string, r: Range) {
    return this.database.db
      .select({
        source: tickets.source,
        count: countAll,
        subtotalMinor: sumOf(tickets.subtotalMinor),
        discountMinor: sumOf(tickets.discountMinor),
        taxMinor: sumOf(tickets.taxMinor),
        totalMinor: sumOf(tickets.totalMinor),
      })
      .from(tickets)
      .where(
        and(
          eq(tickets.salonId, salonId),
          eq(tickets.branchId, branchId),
          eq(tickets.status, 'paid'),
          gte(tickets.paidAt, r.from),
          lt(tickets.paidAt, r.to),
          isNull(tickets.deletedAt),
        ),
      )
      .groupBy(tickets.source);
  }

  /** Tickets voided in the range. */
  async voided(salonId: string, branchId: string, r: Range) {
    const [row] = await this.database.db
      .select({ count: countAll, totalMinor: sumOf(tickets.totalMinor) })
      .from(tickets)
      .where(
        and(
          eq(tickets.salonId, salonId),
          eq(tickets.branchId, branchId),
          eq(tickets.status, 'voided'),
          gte(tickets.voidedAt, r.from),
          lt(tickets.voidedAt, r.to),
          isNull(tickets.deletedAt),
        ),
      );
    return row ?? { count: 0, totalMinor: 0 };
  }

  /** Refunds issued in the range. */
  async refunded(salonId: string, branchId: string, r: Range) {
    const [row] = await this.database.db
      .select({ count: countAll, amountMinor: sumOf(refunds.amountMinor) })
      .from(refunds)
      .where(
        and(
          eq(refunds.salonId, salonId),
          eq(refunds.branchId, branchId),
          gte(refunds.createdAt, r.from),
          lt(refunds.createdAt, r.to),
          isNull(refunds.deletedAt),
        ),
      );
    return row ?? { count: 0, amountMinor: 0 };
  }

  /** Completed payments taken in the range, per method. */
  paymentsByMethod(salonId: string, branchId: string, r: Range) {
    return this.database.db
      .select({ method: payments.method, amountMinor: sumOf(payments.amountMinor) })
      .from(payments)
      .where(
        and(
          eq(payments.salonId, salonId),
          eq(payments.branchId, branchId),
          eq(payments.status, 'completed'),
          gte(payments.createdAt, r.from),
          lt(payments.createdAt, r.to),
          isNull(payments.deletedAt),
        ),
      )
      .groupBy(payments.method);
  }

  private paidLineFilter(salonId: string, r: Range, branchId?: string): SQL {
    return and(
      eq(ticketLines.salonId, salonId),
      isNull(ticketLines.deletedAt),
      eq(tickets.status, 'paid'),
      gte(tickets.paidAt, r.from),
      lt(tickets.paidAt, r.to),
      branchId ? eq(tickets.branchId, branchId) : undefined,
    ) as SQL;
  }

  /** Service lines on paid tickets, grouped by service. */
  salesByService(salonId: string, r: Range, branchId?: string) {
    return this.database.db
      .select({
        serviceId: ticketLines.refId,
        name: ticketLines.description,
        quantity: sumOf(ticketLines.qty),
        revenueMinor: sumOf(ticketLines.lineTotalMinor),
      })
      .from(ticketLines)
      .innerJoin(tickets, eq(tickets.id, ticketLines.ticketId))
      .where(
        and(this.paidLineFilter(salonId, r, branchId), eq(ticketLines.kind, 'service')),
      )
      .groupBy(ticketLines.refId, ticketLines.description)
      .orderBy(sql`sum(${ticketLines.lineTotalMinor}) desc`);
  }

  /** Lines on paid tickets, grouped by the stylist who did the work. */
  salesByStylist(salonId: string, r: Range, branchId?: string) {
    return this.database.db
      .select({
        stylistId: ticketLines.stylistId,
        displayName: stylistProfiles.displayName,
        revenueMinor: sumOf(ticketLines.lineTotalMinor),
        ticketCount: sql<number>`count(distinct ${ticketLines.ticketId})::int`,
        serviceCount: sql<number>`coalesce(sum(${ticketLines.qty}) filter (where ${ticketLines.kind} = 'service'), 0)::float8`,
      })
      .from(ticketLines)
      .innerJoin(tickets, eq(tickets.id, ticketLines.ticketId))
      .leftJoin(stylistProfiles, eq(stylistProfiles.id, ticketLines.stylistId))
      .where(this.paidLineFilter(salonId, r, branchId))
      .groupBy(ticketLines.stylistId, stylistProfiles.displayName)
      .orderBy(sql`sum(${ticketLines.lineTotalMinor}) desc`);
  }

  findSession(salonId: string, id: string) {
    return this.database.db.query.registerSessions.findFirst({
      where: and(
        eq(registerSessions.id, id),
        eq(registerSessions.salonId, salonId),
        isNull(registerSessions.deletedAt),
      ),
    });
  }

  /** Cash taken and cash refunded for one register session. */
  async sessionCash(salonId: string, sessionId: string) {
    const [taken] = await this.database.db
      .select({ amountMinor: sumOf(payments.amountMinor) })
      .from(payments)
      .where(
        and(
          eq(payments.salonId, salonId),
          eq(payments.registerSessionId, sessionId),
          eq(payments.method, 'cash'),
          eq(payments.status, 'completed'),
          isNull(payments.deletedAt),
        ),
      );
    const [returned] = await this.database.db
      .select({ amountMinor: sumOf(refunds.amountMinor) })
      .from(refunds)
      .innerJoin(payments, eq(payments.id, refunds.paymentId))
      .where(
        and(
          eq(refunds.salonId, salonId),
          eq(payments.registerSessionId, sessionId),
          eq(payments.method, 'cash'),
          isNull(refunds.deletedAt),
        ),
      );
    return {
      takenMinor: taken?.amountMinor ?? 0,
      refundedMinor: returned?.amountMinor ?? 0,
    };
  }
}
