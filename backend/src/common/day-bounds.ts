/** Minutes the zone is ahead of UTC at the given instant (Karachi = +300). */
function offsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return (asUtc - at.getTime()) / 60000;
}

/** The UTC instant at which `date` (YYYY-MM-DD) begins in `timeZone`. */
function startOfLocalDay(date: string, timeZone: string): Date {
  const naive = new Date(`${date}T00:00:00Z`);
  const first = new Date(naive.getTime() - offsetMinutes(naive, timeZone) * 60000);
  // Re-evaluate at the candidate instant so a DST change on that day is honoured.
  return new Date(naive.getTime() - offsetMinutes(first, timeZone) * 60000);
}

/**
 * [from, to) as UTC instants covering the whole local calendar day `date` in the
 * salon's timezone. Used wherever "today" or "that day" must mean the salon's
 * day, not UTC's (appointments board, the day report).
 */
export function dayBoundsUtc(
  date: string,
  timeZone: string,
): { from: Date; to: Date } {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDate = next.toISOString().slice(0, 10);
  return {
    from: startOfLocalDay(date, timeZone),
    to: startOfLocalDay(nextDate, timeZone),
  };
}
