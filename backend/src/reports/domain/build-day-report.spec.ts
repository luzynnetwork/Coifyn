import { describe, expect, it } from 'vitest';
import { buildDayReport, type PaidSourceRow } from './build-day-report.js';

const none = { count: 0, totalMinor: 0 };
const noRefunds = { count: 0, amountMinor: 0 };

describe('buildDayReport', () => {
  it('is all zeros for an empty day, with no divide-by-zero', () => {
    const r = buildDayReport([], none, noRefunds, []);
    expect(r).toMatchObject({
      ticketCount: 0,
      totalMinor: 0,
      netMinor: 0,
      averageTicketMinor: 0,
      walkIns: 0,
      appointments: 0,
      paymentsByMethod: { cash: 0, card: 0 },
    });
  });

  it('adds sources together and keeps net + tax = total', () => {
    const paid: PaidSourceRow[] = [
      { source: 'walk_in', count: 2, subtotalMinor: 4000, discountMinor: 200, taxMinor: 304, totalMinor: 4104 },
      { source: 'appointment', count: 1, subtotalMinor: 3000, discountMinor: 0, taxMinor: 240, totalMinor: 3240 },
    ];
    const r = buildDayReport(paid, none, noRefunds, []);
    expect(r.ticketCount).toBe(3);
    expect(r.grossMinor).toBe(7000);
    expect(r.discountsMinor).toBe(200);
    expect(r.taxMinor).toBe(544);
    expect(r.totalMinor).toBe(7344);
    expect(r.netMinor + r.taxMinor).toBe(r.totalMinor);
    // gross - discount + tax = total for exclusive-tax tickets
    expect(r.grossMinor - r.discountsMinor + r.taxMinor).toBe(r.totalMinor);
  });

  it('rounds the average ticket to a whole minor unit', () => {
    const paid: PaidSourceRow[] = [
      { source: 'walk_in', count: 3, subtotalMinor: 1000, discountMinor: 0, taxMinor: 0, totalMinor: 1000 },
    ];
    expect(buildDayReport(paid, none, noRefunds, []).averageTicketMinor).toBe(333);
  });

  it('counts queue and walk-in as walk-ins, and reports appointments apart', () => {
    const paid: PaidSourceRow[] = [
      { source: 'queue', count: 2, subtotalMinor: 0, discountMinor: 0, taxMinor: 0, totalMinor: 0 },
      { source: 'walk_in', count: 1, subtotalMinor: 0, discountMinor: 0, taxMinor: 0, totalMinor: 0 },
      { source: 'appointment', count: 4, subtotalMinor: 0, discountMinor: 0, taxMinor: 0, totalMinor: 0 },
    ];
    const r = buildDayReport(paid, none, noRefunds, []);
    expect(r.walkIns).toBe(3);
    expect(r.appointments).toBe(4);
  });

  it('reports voids and refunds beside the sales, never netted into them', () => {
    const paid: PaidSourceRow[] = [
      { source: 'walk_in', count: 1, subtotalMinor: 2000, discountMinor: 0, taxMinor: 0, totalMinor: 2000 },
    ];
    const r = buildDayReport(
      paid,
      { count: 2, totalMinor: 3500 },
      { count: 1, amountMinor: 500 },
      [],
    );
    expect(r.totalMinor).toBe(2000);
    expect(r.voids).toEqual({ count: 2, totalMinor: 3500 });
    expect(r.refunds).toEqual({ count: 1, amountMinor: 500 });
  });

  it('splits payments by method', () => {
    const r = buildDayReport([], none, noRefunds, [
      { method: 'cash', amountMinor: 1200 },
      { method: 'card', amountMinor: 800 },
    ]);
    expect(r.paymentsByMethod).toEqual({ cash: 1200, card: 800 });
  });
});
