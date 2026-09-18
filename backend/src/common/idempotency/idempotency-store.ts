export interface StoredResponse {
  kind: 'response';
  status: number;
  body: unknown;
}

export interface Pending {
  kind: 'pending';
}

export type IdempotencyEntry = StoredResponse | Pending;

/**
 * Backs the {@link IdempotencyInterceptor}. Two implementations, bound by whether
 * a Redis connection exists (idempotency.module.ts):
 *   - Redis  — survives restarts and works across instances (the real path)
 *   - in-memory — a bounded Map with TTLs, for local dev / CI without Redis
 */
export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyEntry | null>;
  /** Atomically claim the key. `false` means another request already holds it. */
  begin(key: string): Promise<boolean>;
  /** Record the final response so a retry replays it. */
  finish(key: string, status: number, body: unknown): Promise<void>;
  /** Drop the pending claim (handler errored) so a retry may proceed. */
  release(key: string): Promise<void>;
}

export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');

/** How long a completed response is replayable. */
export const RESPONSE_TTL_SECONDS = 24 * 60 * 60;
/** How long a pending claim is held before it is assumed abandoned. */
export const PENDING_TTL_SECONDS = 60;
