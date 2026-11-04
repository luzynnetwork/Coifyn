import { eachDate, localTimeToUtc, weekdayOf } from '../../common/day-bounds.js';

export interface PatternEntry {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** Salon-local "HH:MM". */
  start: string;
  end: string;
}

export interface ExpandedShift {
  startAt: Date;
  endAt: Date;
}

/** Turns a weekly pattern into concrete UTC shifts for each local date in
 *  [from, to], honouring the salon's timezone. */
export function expandTemplate(
  pattern: PatternEntry[],
  from: string,
  to: string,
  timeZone: string,
): ExpandedShift[] {
  const shifts: ExpandedShift[] = [];
  for (const date of eachDate(from, to)) {
    const weekday = weekdayOf(date);
    for (const entry of pattern.filter((p) => p.weekday === weekday)) {
      shifts.push({
        startAt: localTimeToUtc(date, entry.start, timeZone),
        endAt: localTimeToUtc(date, entry.end, timeZone),
      });
    }
  }
  return shifts;
}
