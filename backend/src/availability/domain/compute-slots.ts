export interface Interval {
  startAt: Date;
  endAt: Date;
}

export interface SlotInput {
  /** The stylist's working blocks. */
  shifts: Interval[];
  /** Everything that blocks time: active appointments, live holds, approved
   *  time off. */
  busy: Interval[];
  durationMin: number;
  /** Slots start on this grid, measured from each shift's start. */
  stepMin?: number;
  /** Slots that start before this instant are not offered. */
  notBefore?: Date;
}

const overlaps = (a: Interval, b: Interval) =>
  a.startAt < b.endAt && b.startAt < a.endAt;

/**
 * Open booking slots: shift time minus busy time, sliced to `durationMin` on a
 * `stepMin` grid. Derived on demand, never stored (phase-2 `availability`).
 */
export function computeSlots(input: SlotInput): Interval[] {
  const step = (input.stepMin ?? 15) * 60000;
  const length = input.durationMin * 60000;
  const slots: Interval[] = [];

  for (const shift of input.shifts) {
    for (
      let t = shift.startAt.getTime();
      t + length <= shift.endAt.getTime();
      t += step
    ) {
      const slot = { startAt: new Date(t), endAt: new Date(t + length) };
      if (input.notBefore && slot.startAt < input.notBefore) continue;
      if (input.busy.some((b) => overlaps(slot, b))) continue;
      slots.push(slot);
    }
  }
  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}
