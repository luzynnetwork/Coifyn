export interface LaneEntry {
  id: string;
  /** Minutes this entry's services take with this stylist. */
  durationMin: number;
}

export interface LaneInput {
  /** The entry currently in the chair, if any. */
  inService?: { durationMin: number; startedAt: Date } | null;
  /** Waiting entries in join order. */
  waiting: LaneEntry[];
  now: Date;
}

export interface LaneWait {
  /** Minutes until the chair is free of the current service. */
  busyMin: number;
  /** Per waiting entry: how many are ahead and the estimated wait. */
  entries: { id: string; ahead: number; minutes: number }[];
  /** What a new joiner on this lane would wait. */
  newJoinerMinutes: number;
}

/**
 * Wait = remaining time of the service in the chair (duration minus elapsed,
 * never below zero) + the full durations of everyone ahead in that stylist's
 * line (phase-2 `queue` rule). Pure; recomputed on every board read so it moves
 * with each queue and status change.
 */
export function computeLaneWait(input: LaneInput): LaneWait {
  const elapsedMin = input.inService
    ? (input.now.getTime() - input.inService.startedAt.getTime()) / 60000
    : 0;
  const busyMin = input.inService
    ? Math.max(0, Math.ceil(input.inService.durationMin - elapsedMin))
    : 0;

  let running = busyMin;
  const entries = input.waiting.map((e, index) => {
    const row = { id: e.id, ahead: index, minutes: running };
    running += e.durationMin;
    return row;
  });
  return { busyMin, entries, newJoinerMinutes: running };
}
