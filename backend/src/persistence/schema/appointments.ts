import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/**
 * A staff-entered booking (Phase 1 `appointments`, minimal — the calendar,
 * holds and self-serve booking are Phase 2/4).
 * status: booked | arrived | in_service | completed | no_show | cancelled
 * "Active" (blocks the stylist/chair) means booked | arrived | in_service.
 */
export const appointments = pgTable(
  'appointment',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    stylistId: uuid('stylist_id').notNull(),
    chairId: uuid('chair_id'),
    customerId: uuid('customer_id'),
    serviceIds: jsonb('service_ids').notNull().default([]),
    addOnIds: jsonb('add_on_ids').notNull().default([]),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('booked'),
    source: text('source').notNull().default('front_desk'),
    notes: text('notes'),
    /** Set when a stand-in takes over: the stylist the customer chose. */
    originalStylistId: uuid('original_stylist_id'),
  },
  (t) => [
    index('appointment_branch_start_idx').on(t.branchId, t.startAt),
    index('appointment_stylist_start_idx').on(t.stylistId, t.startAt),
    index('appointment_chair_start_idx').on(t.chairId, t.startAt),
  ],
);

/** Short-TTL lock on a stylist's slot while a booking flow completes. */
export const bookingHolds = pgTable(
  'booking_hold',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    stylistId: uuid('stylist_id').notNull(),
    chairId: uuid('chair_id'),
    serviceIds: jsonb('service_ids').notNull().default([]),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    heldBy: uuid('held_by').notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (t) => [index('booking_hold_stylist_start_idx').on(t.stylistId, t.startAt)],
);

/** Immutable history of an appointment being moved. */
export const appointmentReschedules = pgTable(
  'appointment_reschedule',
  {
    ...baseColumns,
    ...tenantColumns,
    appointmentId: uuid('appointment_id').notNull(),
    fromStartAt: timestamp('from_start_at', { withTimezone: true }).notNull(),
    fromEndAt: timestamp('from_end_at', { withTimezone: true }).notNull(),
    toStartAt: timestamp('to_start_at', { withTimezone: true }).notNull(),
    toEndAt: timestamp('to_end_at', { withTimezone: true }).notNull(),
    rescheduledBy: uuid('rescheduled_by').notNull(),
    reason: text('reason'),
  },
  (t) => [index('appointment_reschedule_appt_idx').on(t.appointmentId)],
);

/** A request from the public customer app; staff confirm it into an
 *  appointment. status: requested | confirmed | declined */
export const bookingRequests = pgTable(
  'booking_request',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    stylistId: uuid('stylist_id').notNull(),
    serviceIds: jsonb('service_ids').notNull().default([]),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    notes: text('notes'),
    status: text('status').notNull().default('requested'),
    appointmentId: uuid('appointment_id'),
    decidedBy: uuid('decided_by'),
  },
  (t) => [index('booking_request_branch_status_idx').on(t.branchId, t.status)],
);
