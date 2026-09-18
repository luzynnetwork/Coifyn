import {
  type IdempotencyEntry,
  type IdempotencyStore,
  PENDING_TTL_SECONDS,
  RESPONSE_TTL_SECONDS,
} from './idempotency-store.js';

interface Slot {
  entry: IdempotencyEntry;
  expiresAt: number;
}

/**
 * Process-local fallback for when there is no Redis. Bounded so a burst of
 * distinct keys cannot grow it without limit; expired slots are swept lazily on
 * access. Not shared across instances — acceptable for local dev / CI only.
 */
export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly slots = new Map<string, Slot>();
  private readonly maxSize = 5000;

  async get(key: string): Promise<IdempotencyEntry | null> {
    this.sweep();
    const slot = this.slots.get(key);
    if (!slot || slot.expiresAt < Date.now()) {
      this.slots.delete(key);
      return null;
    }
    return slot.entry;
  }

  async begin(key: string): Promise<boolean> {
    if (await this.get(key)) return false;
    this.put(key, { kind: 'pending' }, PENDING_TTL_SECONDS);
    return true;
  }

  async finish(key: string, status: number, body: unknown): Promise<void> {
    this.put(key, { kind: 'response', status, body }, RESPONSE_TTL_SECONDS);
  }

  async release(key: string): Promise<void> {
    this.slots.delete(key);
  }

  private put(key: string, entry: IdempotencyEntry, ttlSeconds: number): void {
    if (this.slots.size >= this.maxSize) {
      const oldest = this.slots.keys().next().value;
      if (oldest) this.slots.delete(oldest);
    }
    this.slots.set(key, { entry, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, slot] of this.slots) {
      if (slot.expiresAt < now) this.slots.delete(key);
    }
  }
}
