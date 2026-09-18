import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigModule } from '../config/config.module.js';
import { AppConfigService } from '../config/config.service.js';

/** DI token for the shared ioredis connection, or `null` when REDIS_URL is
 *  unset (the Phase 0 slice runs without Redis). */
export const REDIS = Symbol('REDIS');
export type RedisConnection = Redis | null;

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: REDIS,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): RedisConnection => {
        const url = config.get('REDIS_URL');
        if (!url) return null;
        // maxRetriesPerRequest: null is what BullMQ requires of its connection.
        return new Redis(url, { maxRetriesPerRequest: null });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
