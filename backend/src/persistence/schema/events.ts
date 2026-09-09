import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { baseColumns } from './_helpers.js';

/**
 * Transactional outbox. A domain event row is written in the SAME transaction as
 * the state change that produced it; a relay worker (events/relay.worker.ts)
 * publishes unpublished rows to BullMQ and stamps `published_at`. Swapping the
 * relay target for Kafka later is a connector change, not a rewrite
 * (architecture.md §8).
 *
 * No RLS: written and read only by system code (the emitting use case, the
 * relay). `salon_id` is kept for partitioning and for consumers that fan out
 * per tenant.
 */
export const domainEvents = pgTable(
  'domain_event',
  {
    ...baseColumns,
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    salonId: uuid('salon_id'),
    correlationId: text('correlation_id'),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (t) => [
    index('domain_event_unpublished_idx').on(t.publishedAt, t.occurredAt),
    index('domain_event_aggregate_idx').on(t.aggregateType, t.aggregateId),
  ],
);
