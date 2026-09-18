import { Logger, type OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type { EventPublisher, PublishableEvent } from './event-publisher.js';

export const DOMAIN_EVENTS_QUEUE = 'domain-events';

/**
 * Forwards outbox rows onto the `domain-events` BullMQ queue, one job per event,
 * keyed by the event id so a re-relay of the same row is deduped by BullMQ
 * (`jobId`). Consumers (notification dispatch, search indexing, …) attach their
 * own workers to this queue in later phases.
 */
export class BullMqEventPublisher implements EventPublisher, OnModuleDestroy {
  private readonly logger = new Logger('EventRelay');
  private readonly queue: Queue;

  constructor(connection: Redis) {
    this.queue = new Queue(DOMAIN_EVENTS_QUEUE, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }

  async publish(events: PublishableEvent[]): Promise<void> {
    await this.queue.addBulk(
      events.map((event) => ({
        name: event.type,
        data: event,
        opts: { jobId: event.id },
      })),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close().catch((err) => {
      this.logger.warn(`queue close failed: ${(err as Error).message}`);
    });
  }
}
