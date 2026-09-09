import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { baseColumns } from './_helpers.js';

/**
 * Immutable audit log. Written in-transaction by the AuditInterceptor on flagged
 * mutating routes and directly by use cases for sensitive actions (voids,
 * discounts, refunds, role changes). Never updated or deleted.
 */
export const auditEvents = pgTable(
  'audit_event',
  {
    ...baseColumns,
    salonId: uuid('salon_id'),
    actorType: text('actor_type').notNull(), // staff | customer | system
    actorId: uuid('actor_id'),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: uuid('target_id'),
    reason: text('reason'),
    before: jsonb('before'),
    after: jsonb('after'),
    correlationId: text('correlation_id'),
    ip: text('ip'),
  },
  (t) => [
    index('audit_event_salon_idx').on(t.salonId, t.createdAt),
    index('audit_event_target_idx').on(t.targetType, t.targetId),
  ],
);
