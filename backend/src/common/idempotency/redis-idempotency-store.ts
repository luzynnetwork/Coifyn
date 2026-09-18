import type { Redis } from 'ioredis';
import {
  type IdempotencyEntry,
  type IdempotencyStore,
  PENDING_TTL_SECONDS,
  RESPONSE_TTL_SECONDS,
} from './idempotency-store.js';

const PENDING = '__pending__';

export class RedisIdempotencyStore implements IdempotencyStore {
  constructor(private readonly redis: Redis) {}

  async get(key: string): Promise<IdempotencyEntry | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;
    if (raw === PENDING) return { kind: 'pending' };
    const parsed = JSON.parse(raw) as { status: number; body: unknown };
    return { kind: 'response', status: parsed.status, body: parsed.body };
  }

  async begin(key: string): Promise<boolean> {
    const ok = await this.redis.set(
      key,
      PENDING,
      'EX',
      PENDING_TTL_SECONDS,
      'NX',
    );
    return ok === 'OK';
  }

  async finish(key: string, status: number, body: unknown): Promise<void> {
    await this.redis.set(
      key,
      JSON.stringify({ status, body }),
      'EX',
      RESPONSE_TTL_SECONDS,
    );
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
