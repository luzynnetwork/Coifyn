import { Logger } from '@nestjs/common';
import type { EventPublisher, PublishableEvent } from './event-publisher.js';

/** Used when there is no Redis. Rows are still relayed (marked published) so the
 *  outbox does not grow unbounded in local dev; delivery is just a log line. */
export class LoggingEventPublisher implements EventPublisher {
  private readonly logger = new Logger('EventRelay');

  async publish(events: PublishableEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.debug(
        `${event.type} (${event.aggregateType}/${event.aggregateId})`,
      );
    }
  }
}
