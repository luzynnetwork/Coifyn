import { Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../persistence/database.service.js';
import { domainEvents } from '../persistence/schema/index.js';
import { assertRegistered, type EventType } from './event-registry.js';

export interface DomainEventInput {
  aggregateType: string;
  aggregateId: string;
  type: EventType;
  payload?: Record<string, unknown>;
  salonId?: string | null;
  correlationId?: string | null;
}

/**
 * The publish side of the transactional outbox. `emit()` writes a `domain_event`
 * row on whatever scope the caller already holds, so the event commits in the
 * SAME transaction as the state change (architecture.md §8). The relay worker
 * (relay/relay.worker.ts) picks up unpublished rows and forwards them; nothing
 * here talks to BullMQ directly.
 *
 * An unregistered event type, or a payload that fails its schema, throws — a
 * programmer error, not a runtime condition to swallow.
 */
@Injectable()
export class EventBus {
  constructor(private readonly database: DatabaseService) {}

  async emit(event: DomainEventInput): Promise<void> {
    await this.emitMany([event]);
  }

  async emitMany(events: DomainEventInput[]): Promise<void> {
    if (events.length === 0) return;
    const rows = events.map((event) => ({
      id: uuidv7(),
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      type: event.type,
      payload: assertRegistered(event.type, event.payload ?? {}),
      salonId: event.salonId ?? null,
      correlationId: event.correlationId ?? null,
    }));
    await this.database.db.insert(domainEvents).values(rows);
  }
}
