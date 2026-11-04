import { describe, expect, it } from 'vitest';
import { computeSlots } from './compute-slots.js';

const at = (hhmm: string) => new Date(`2026-09-19T${hhmm}:00Z`);
const shift = { startAt: at('09:00'), endAt: at('12:00') };

describe('computeSlots', () => {
  it('slices a shift into duration-long slots on the step grid', () => {
    const slots = computeSlots({ shifts: [shift], busy: [], durationMin: 60, stepMin: 60 });
    expect(slots.map((s) => s.startAt.toISOString().slice(11, 16))).toEqual([
      '09:00',
      '10:00',
      '11:00',
    ]);
  });

  it('removes slots that overlap a busy interval', () => {
    const slots = computeSlots({
      shifts: [shift],
      busy: [{ startAt: at('10:00'), endAt: at('10:30') }],
      durationMin: 30,
      stepMin: 30,
    });
    expect(slots.map((s) => s.startAt.toISOString().slice(11, 16))).toEqual([
      '09:00',
      '09:30',
      '10:30',
      '11:00',
      '11:30',
    ]);
  });

  it('time off covering the whole shift leaves no slots', () => {
    const slots = computeSlots({
      shifts: [shift],
      busy: [{ startAt: at('08:00'), endAt: at('13:00') }],
      durationMin: 30,
    });
    expect(slots).toEqual([]);
  });

  it('never offers a slot that would run past the end of the shift', () => {
    const slots = computeSlots({ shifts: [shift], busy: [], durationMin: 45, stepMin: 60 });
    expect(slots.at(-1)?.endAt.toISOString().slice(11, 16)).toBe('11:45');
  });

  it('skips slots starting before notBefore', () => {
    const slots = computeSlots({
      shifts: [shift],
      busy: [],
      durationMin: 60,
      stepMin: 60,
      notBefore: at('09:30'),
    });
    expect(slots[0].startAt.toISOString().slice(11, 16)).toBe('10:00');
  });
});
