export interface Range {
  from: Date;
  to: Date;
}

export type DashboardRange = 'today' | 'week' | 'month';

/** n / d as a 0–1 ratio, or null when there is nothing to divide by. */
export function ratio(n: number, d: number): number | null {
  return d > 0 ? n / d : null;
}

/** Percentage change from `previous` to `current`; null if previous is 0/absent. */
export function changePct(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** The period of the same length immediately before `range`. */
export function previousRange(range: Range): Range {
  const length = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - length), to: range.from };
}

/** Days covered by each named range; `today` is the salon-local day itself. */
export const RANGE_DAYS: Record<DashboardRange, number> = {
  today: 1,
  week: 7,
  month: 30,
};
