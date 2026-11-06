import { describe, expect, it } from 'vitest';
import { pointsForSpend, tierFor } from './points.js';

describe('pointsForSpend', () => {
  it('earns per whole currency unit, rounded down', () => {
    expect(pointsForSpend(2599, 1)).toBe(25);
    expect(pointsForSpend(2599, 2)).toBe(50);
  });

  it('earns nothing for zero spend or a zero rate', () => {
    expect(pointsForSpend(0, 1)).toBe(0);
    expect(pointsForSpend(5000, 0)).toBe(0);
  });
});

describe('tierFor', () => {
  const tiers = [
    { name: 'Gold', minPoints: 500 },
    { name: 'Silver', minPoints: 100 },
  ];

  it('picks the highest tier reached', () => {
    expect(tierFor(600, tiers)).toBe('Gold');
    expect(tierFor(100, tiers)).toBe('Silver');
  });

  it('is null below every threshold', () => {
    expect(tierFor(99, tiers)).toBeNull();
  });
});
