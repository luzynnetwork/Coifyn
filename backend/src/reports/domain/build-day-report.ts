export interface PaidSourceRow {
  source: string;
  count: number;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export interface DayReport {
  ticketCount: number;
  /** Sum of line totals before any discount or tax. */
  grossMinor: number;
  discountsMinor: number;
  taxMinor: number;
  /** What was billed, tax included. `net + tax = total` always. */
  totalMinor: number;
  /** Sales excluding tax: total - tax. */
  netMinor: number;
  averageTicketMinor: number;
  voids: { count: number; totalMinor: number };
  refunds: { count: number; amountMinor: number };
  bySource: Record<string, number>;
  walkIns: number;
  appointments: number;
  paymentsByMethod: { cash: number; card: number };
}

/**
 * Folds the day's aggregates into the report. Definitions, stated once:
 *   gross    = Σ subtotal            (before discount and tax)
 *   discount = Σ discount
 *   tax      = Σ tax
 *   total    = Σ total               (billed, tax included)
 *   net      = total - tax           (sales excluding tax)
 *   average  = total / tickets, rounded to a whole minor unit
 * Voids and refunds are reported beside these, not netted into them, so each
 * can be traced to its own records.
 */
export function buildDayReport(
  paid: readonly PaidSourceRow[],
  voided: { count: number; totalMinor: number },
  refunded: { count: number; amountMinor: number },
  methods: readonly { method: string; amountMinor: number }[],
): DayReport {
  const sum = (pick: (r: PaidSourceRow) => number) =>
    paid.reduce((s, r) => s + pick(r), 0);

  const ticketCount = sum((r) => r.count);
  const totalMinor = sum((r) => r.totalMinor);
  const taxMinor = sum((r) => r.taxMinor);

  const bySource: Record<string, number> = {};
  for (const r of paid) bySource[r.source] = r.count;

  const methodTotal = (m: string) =>
    methods.filter((x) => x.method === m).reduce((s, x) => s + x.amountMinor, 0);

  return {
    ticketCount,
    grossMinor: sum((r) => r.subtotalMinor),
    discountsMinor: sum((r) => r.discountMinor),
    taxMinor,
    totalMinor,
    netMinor: totalMinor - taxMinor,
    averageTicketMinor: ticketCount ? Math.round(totalMinor / ticketCount) : 0,
    voids: { count: voided.count, totalMinor: voided.totalMinor },
    refunds: { count: refunded.count, amountMinor: refunded.amountMinor },
    bySource,
    walkIns: (bySource.walk_in ?? 0) + (bySource.queue ?? 0),
    appointments: bySource.appointment ?? 0,
    paymentsByMethod: { cash: methodTotal('cash'), card: methodTotal('card') },
  };
}
