import { describe, expect, it } from 'vitest';
import { computeLaneWait } from './compute-wait.js';

const now = new Date('2026-09-19T10:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

describe('computeLaneWait', () => {
  it('is zero for an empty lane', () => {
    expect(computeLaneWait({ waiting: [], now })).toEqual({
      busyMin: 0,
      entries: [],
      newJoinerMinutes: 0,
    });
  });

  it('sums durations of those ahead ("2 ahead, ~35 min")', () => {
    const wait = computeLaneWait({
      inService: { durationMin: 30, startedAt: minutesAgo(25) },
      waiting: [
        { id: 'a', durationMin: 15 },
        { id: 'b', durationMin: 15 },
        { id: 'c', durationMin: 30 },
      ],
      now,
    });
    expect(wait.busyMin).toBe(5);
    expect(wait.entries).toEqual([
      { id: 'a', ahead: 0, minutes: 5 },
      { id: 'b', ahead: 1, minutes: 20 },
      { id: 'c', ahead: 2, minutes: 35 },
    ]);
    expect(wait.newJoinerMinutes).toBe(65);
  });

  it('never goes negative when a service overruns', () => {
    const wait = computeLaneWait({
      inService: { durationMin: 20, startedAt: minutesAgo(40) },
      waiting: [{ id: 'a', durationMin: 10 }],
      now,
    });
    expect(wait.busyMin).toBe(0);
    expect(wait.entries[0].minutes).toBe(0);
  });
});
