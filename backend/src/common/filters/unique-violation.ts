/** Postgres SQLSTATE for a unique-constraint violation. */
const UNIQUE_VIOLATION = '23505';

/**
 * True if `error`, or anything in its `cause` chain, is a Postgres unique
 * violation. Drizzle wraps the driver error, so the code sits one or two
 * levels down.
 *
 * Application-level "does it exist yet?" checks followed by an insert can lose
 * a race to a concurrent request; the unique index is the real guard, and this
 * lets the API answer that case as a conflict instead of a server error.
 */
export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if ((current as { code?: unknown }).code === UNIQUE_VIOLATION) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}
