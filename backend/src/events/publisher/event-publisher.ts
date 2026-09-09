/**
 * Where the relay forwards a committed outbox row. One implementation is bound
 * per environment (events.module.ts):
 *   - BullMQ when REDIS_URL is set (the real path)
 *   - a logging no-op otherwise (the Phase 0 slice, and CI without Redis)
 *
 * Swapping this for a Kafka producer at the scale trigger is a new impl + a
 * binding change — no call-site touches (architecture.md §2.3).
 */
export interface PublishableEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  type: string;
  payload: unknown;
  salonId: string | null;
  correlationId: string | null;
  occurredAt: Date;
}

export interface EventPublisher {
  /** Forward a batch. Must be safe to call again with the same events (the relay
   *  is at-least-once) — downstream consumers dedupe on `id`. */
  publish(events: PublishableEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
