import { Global, Module } from '@nestjs/common';
import { REDIS, type RedisConnection } from '../redis/redis.module.js';
import { EventBus } from './event-bus.js';
import {
  EVENT_PUBLISHER,
  type EventPublisher,
} from './publisher/event-publisher.js';
import { BullMqEventPublisher } from './publisher/bullmq-publisher.js';
import { LoggingEventPublisher } from './publisher/logging-publisher.js';
import { OutboxRepo } from './relay/outbox.repo.js';
import { RelayWorker } from './relay/relay.worker.js';

/**
 * The transactional outbox. Feature modules emit through {@link EventBus}; the
 * {@link RelayWorker} forwards committed rows to the bound {@link EventPublisher}
 * — BullMQ when a Redis connection exists, a logging no-op otherwise.
 */
@Global()
@Module({
  providers: [
    EventBus,
    OutboxRepo,
    RelayWorker,
    {
      provide: EVENT_PUBLISHER,
      inject: [REDIS],
      useFactory: (redis: RedisConnection): EventPublisher =>
        redis
          ? new BullMqEventPublisher(redis)
          : new LoggingEventPublisher(),
    },
  ],
  exports: [EventBus],
})
export class EventsModule {}
