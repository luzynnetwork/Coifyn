/**
 * Report wire types, mirrored from backend/src/reports (build-day-report.ts,
 * reports.repo.ts and the application use cases). Money is integer minor units.
 */

/** GET /reports/day?branchId&date. Voids and refunds are reported beside the sales figures, not netted in. */
export interface DayReportView {
  branchId: string;
  date: string;
  timezone: string;
  ticketCount: number;
  /** Sum of line totals before discount and tax. */
  grossMinor: number;
  discountsMinor: number;
  taxMinor: number;
  /** Billed, tax included. */
  totalMinor: number;
  /** total - tax. */
  netMinor: number;
  averageTicketMinor: number;
  voids: { count: number; totalMinor: number };
  refunds: { count: number; amountMinor: number };
  /** Paid ticket count per source (queue | appointment | walk_in). */
  bySource: Record<string, number>;
  /** walk_in + queue tickets. */
  walkIns: number;
  appointments: number;
  paymentsByMethod: { cash: number; card: number };
}

/** GET /reports/sales/by-service?from&to&branchId? */
export interface SalesByServiceRow {
  serviceId: string;
  name: string;
  /** Total quantity sold. */
  quantity: number;
  /** Line totals before ticket-level discount and tax. */
  revenueMinor: number;
}

/** GET /reports/sales/by-stylist?from&to&branchId? (a line with no stylist has null id/name). */
export interface SalesByStylistRow {
  stylistId: string | null;
  displayName: string | null;
  revenueMinor: number;
  ticketCount: number;
  serviceCount: number;
}

/** GET /reports/register-session/:id (till reconciliation). */
export interface RegisterSessionReportView {
  sessionId: string;
  branchId: string;
  openedAt: string;
  closedAt: string | null;
  openingFloatMinor: number;
  cashTakenMinor: number;
  cashRefundedMinor: number;
  /** opening float + cash taken - cash refunded. */
  expectedMinor: number;
  /** null until the session is closed. */
  countedMinor: number | null;
  /** counted - expected; null until closed. */
  varianceMinor: number | null;
}
