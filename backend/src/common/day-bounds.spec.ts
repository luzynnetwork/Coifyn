import { describe, expect, it } from 'vitest';
import { dayBoundsUtc } from './day-bounds.js';

describe('dayBoundsUtc', () => {
  it('is the plain UTC day for UTC', () => {
    const { from, to } = dayBoundsUtc('2026-09-19', 'UTC');
    expect(from.toISOString()).toBe('2026-09-19T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-09-20T00:00:00.000Z');
  });

  it('shifts a zone ahead of UTC back (Karachi is UTC+5)', () => {
    const { from, to } = dayBoundsUtc('2026-09-19', 'Asia/Karachi');
    expect(from.toISOString()).toBe('2026-09-18T19:00:00.000Z');
    expect(to.toISOString()).toBe('2026-09-19T19:00:00.000Z');
  });

  it('shifts a zone behind UTC forward (New York in summer is UTC-4)', () => {
    const { from } = dayBoundsUtc('2026-07-01', 'America/New_York');
    expect(from.toISOString()).toBe('2026-07-01T04:00:00.000Z');
  });

  it('gives a 23h day across a spring-forward change', () => {
    const { from, to } = dayBoundsUtc('2026-03-08', 'America/New_York');
    expect((to.getTime() - from.getTime()) / 3600000).toBe(23);
  });

  it('gives a 25h day across a fall-back change', () => {
    const { from, to } = dayBoundsUtc('2026-11-01', 'America/New_York');
    expect((to.getTime() - from.getTime()) / 3600000).toBe(25);
  });
});
