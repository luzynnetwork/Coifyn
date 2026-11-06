/**
 * Phase 2 timers (reminders, roster generation, disruption escalation) run in
 * the API process on an interval — the same approach as the outbox relay. They
 * are off under NODE_ENV=test and when BACKGROUND_WORKERS=off, so e2e specs call
 * the underlying use cases directly and deterministically.
 */
export function backgroundWorkersEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'test' && process.env.BACKGROUND_WORKERS !== 'off'
  );
}
