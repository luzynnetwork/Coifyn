import { describe, expect, it } from 'vitest';
import { computeTotals } from './compute-totals.js';

const exclusive8 = { basisPoints: 800, inclusive: false };
const inclusive8 = { basisPoints: 800, inclusive: true };

describe('computeTotals', () => {
  it('is all zeros for an empty ticket', () => {
    expect(computeTotals([], null, exclusive8)).toEqual({
      subtotalMinor: 0,
      discountMinor: 0,
      taxMinor: 0,
      totalMinor: 0,
    });
  });

  it('adds exclusive tax on top of the subtotal', () => {
    expect(computeTotals([1500, 500], null, exclusive8)).toEqual({
      subtotalMinor: 2000,
      discountMinor: 0,
      taxMinor: 160,
      totalMinor: 2160,
    });
  });

  it('backs inclusive tax out of the price without changing the total', () => {
    // 2160 gross at 8% => net 2000, tax 160
    expect(computeTotals([2160], null, inclusive8)).toEqual({
      subtotalMinor: 2160,
      discountMinor: 0,
      taxMinor: 160,
      totalMinor: 2160,
    });
  });

  it('charges no tax with no rate or a 0% rate', () => {
    expect(computeTotals([1000], null, null).totalMinor).toBe(1000);
    expect(
      computeTotals([1000], null, { basisPoints: 0, inclusive: false }),
    ).toMatchObject({ taxMinor: 0, totalMinor: 1000 });
  });

  it('applies a percent discount before tax, so it also reduces the tax', () => {
    // 10% off 2000 = 200 -> taxable 1800 -> tax 144 -> total 1944
    expect(
      computeTotals([2000], { type: 'percent', value: 1000 }, exclusive8),
    ).toEqual({
      subtotalMinor: 2000,
      discountMinor: 200,
      taxMinor: 144,
      totalMinor: 1944,
    });
  });

  it('applies a fixed-amount discount', () => {
    expect(
      computeTotals([2000], { type: 'amount', value: 500 }, exclusive8),
    ).toMatchObject({ discountMinor: 500, taxMinor: 120, totalMinor: 1620 });
  });

  it('caps a discount at the subtotal so a ticket never goes negative', () => {
    expect(
      computeTotals([1000], { type: 'amount', value: 5000 }, exclusive8),
    ).toEqual({
      subtotalMinor: 1000,
      discountMinor: 1000,
      taxMinor: 0,
      totalMinor: 0,
    });
    expect(
      computeTotals([1000], { type: 'percent', value: 15000 }, null)
        .discountMinor,
    ).toBe(1000);
  });

  it('rounds each figure once, half up, and always reconciles', () => {
    // 333 * 8.25% = 27.4725 -> 27
    const t = computeTotals([333], null, { basisPoints: 825, inclusive: false });
    expect(t.taxMinor).toBe(27);
    expect(t.totalMinor).toBe(t.subtotalMinor - t.discountMinor + t.taxMinor);
  });

  it('keeps total = subtotal - discount + tax for exclusive tax across many inputs', () => {
    for (const cents of [1, 99, 100, 101, 1999, 12345]) {
      for (const bp of [0, 50, 825, 1300, 2000]) {
        const t = computeTotals(
          [cents],
          { type: 'percent', value: 750 },
          { basisPoints: bp, inclusive: false },
        );
        expect(t.totalMinor).toBe(t.subtotalMinor - t.discountMinor + t.taxMinor);
        expect(Number.isInteger(t.totalMinor)).toBe(true);
      }
    }
  });

  it('inclusive tax never exceeds the taxable amount', () => {
    for (const cents of [1, 7, 99, 12345]) {
      const t = computeTotals([cents], null, inclusive8);
      expect(t.taxMinor).toBeGreaterThanOrEqual(0);
      expect(t.taxMinor).toBeLessThanOrEqual(cents);
      expect(t.totalMinor).toBe(cents);
    }
  });
});
