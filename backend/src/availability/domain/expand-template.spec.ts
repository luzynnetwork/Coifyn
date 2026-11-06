import { describe, expect, it } from 'vitest';
import { expandTemplate } from './expand-template.js';

describe('expandTemplate', () => {
  // 2026-09-21 is a Monday.
  const pattern = [
    { weekday: 1, start: '09:00', end: '17:00' },
    { weekday: 3, start: '10:00', end: '14:00' },
  ];

  it('creates one shift per matching weekday in the range', () => {
    const shifts = expandTemplate(pattern, '2026-09-21', '2026-09-27', 'UTC');
    expect(shifts).toHaveLength(2);
    expect(shifts[0].startAt.toISOString()).toBe('2026-09-21T09:00:00.000Z');
    expect(shifts[1].startAt.toISOString()).toBe('2026-09-23T10:00:00.000Z');
  });

  it('interprets times in the salon timezone (Karachi = UTC+5)', () => {
    const [shift] = expandTemplate(pattern, '2026-09-21', '2026-09-21', 'Asia/Karachi');
    expect(shift.startAt.toISOString()).toBe('2026-09-21T04:00:00.000Z');
    expect(shift.endAt.toISOString()).toBe('2026-09-21T12:00:00.000Z');
  });

  it('spans multiple weeks', () => {
    expect(expandTemplate(pattern, '2026-09-21', '2026-10-04', 'UTC')).toHaveLength(4);
  });
});
