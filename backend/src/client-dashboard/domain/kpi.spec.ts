import { describe, expect, it } from 'vitest';
import { changePct, previousRange, ratio } from './kpi.js';

describe('kpi helpers', () => {
  it('ratio is null when the denominator is zero', () => {
    expect(ratio(1, 0)).toBeNull();
    expect(ratio(1, 4)).toBe(0.25);
  });

  it('changePct compares to the previous period', () => {
    expect(changePct(150, 100)).toBe(50);
    expect(changePct(50, 100)).toBe(-50);
    expect(changePct(10, 0)).toBeNull();
    expect(changePct(null, 10)).toBeNull();
  });

  it('previousRange is the equal-length period just before', () => {
    const range = {
      from: new Date('2026-09-08T00:00:00Z'),
      to: new Date('2026-09-15T00:00:00Z'),
    };
    const prev = previousRange(range);
    expect(prev.to).toEqual(range.from);
    expect(prev.from.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });
});
