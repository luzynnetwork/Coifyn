import { Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../persistence/database.service.js';
import { domainEvents } from '../persistence/schema/index.js';

export interface DomainEventInput {
  aggregateType: string;
  aggregateId: string;
  type: string;
  payload?: Record<string, unknown>;
  salonId?: string | null;
  correlationId?: string | null;
}

/**
 * The publish side of the transactional outbox. `emit()` writes a `domain_event`
 * row on whatever scope the caller already holds, so the event commits in the
 * SAME transaction as the state change (architecture.md §8). A relay worker
 * (events phase) picks up unpublished rows and pushes them to the bus; nothing
 * here talks to BullMQ directly.
 */
@Injectable()
export class EventBus {
  constructor(private readonly database: DatabaseService) {}

  async emit(event: DomainEventInput): Promise<void> {
    await this.database.db.insert(domainEvents).values({
      id: uuidv7(),
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      type: event.type,
      payload: event.payload ?? {},
      salonId: event.salonId ?? null,
      correlationId: event.correlationId ?? null,
    });
  }

  async emitMany(events: DomainEventInput[]): Promise<void> {
    if (events.length === 0) return;
    await this.database.db.insert(domainEvents).values(
      events.map((event) => ({
        id: uuidv7(),
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        type: event.type,
        payload: event.payload ?? {},
        salonId: event.salonId ?? null,
        correlationId: event.correlationId ?? null,
      })),
    );
  }
}
