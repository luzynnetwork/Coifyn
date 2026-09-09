import { Global, Module } from '@nestjs/common';
import { REDIS, type RedisConnection } from '../../redis/redis.module.js';
import {
  IDEMPOTENCY_STORE,
  type IdempotencyStore,
} from './idempotency-store.js';
import { MemoryIdempotencyStore } from './memory-idempotency-store.js';
import { RedisIdempotencyStore } from './redis-idempotency-store.js';
import { IdempotencyInterceptor } from './idempotency.interceptor.js';

@Global()
@Module({
  providers: [
    {
      provide: IDEMPOTENCY_STORE,
      inject: [REDIS],
      useFactory: (redis: RedisConnection): IdempotencyStore =>
        redis
          ? new RedisIdempotencyStore(redis)
          : new MemoryIdempotencyStore(),
    },
    IdempotencyInterceptor,
  ],
  exports: [IDEMPOTENCY_STORE, IdempotencyInterceptor],
})
export class IdempotencyModule {}
