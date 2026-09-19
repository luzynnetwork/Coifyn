import { z } from 'zod';

/**
 * The typed registry of every domain event the system may emit. `EventBus.emit()`
 * refuses a type that is not listed here — a new event is a deliberate registry
 * change, never an ad-hoc string (architecture.md §8). Where a payload schema is
 * given, the payload is validated on emit.
 *
 * When the frontend needs these names/shapes they move to a shared package or
 * are code-generated from here; for now the backend is the source of truth.
 */
const anyPayload = z.record(z.string(), z.unknown());
const appointmentPayload = z.object({
  appointmentId: z.string(),
  branchId: z.string(),
  stylistId: z.string(),
});

export const EVENT_REGISTRY = {
  // ── auth ──────────────────────────────────────────────────────────────────
  UserRegistered: z.object({ email: z.string() }),
  UserLoggedIn: z.object({ email: z.string() }),
  PasswordResetRequested: z.object({ userId: z.string() }),
  PasswordResetCompleted: z.object({ userId: z.string() }),

  // ── tenancy ───────────────────────────────────────────────────────────────
  SalonCreated: z.object({ slug: z.string(), brandName: z.string() }),
  SalonUpdated: z.object({ changed: z.array(z.string()) }),
  BranchCreated: z.object({ name: z.string() }),
  BranchUpdated: z.object({ changed: z.array(z.string()) }),
  BranchDeleted: anyPayload,
  ChairCreated: z.object({ branchId: z.string(), label: z.string() }),
  ChairUpdated: z.object({ changed: z.array(z.string()) }),
  ChairRetired: z.object({ branchId: z.string() }),
  BranchHoursUpdated: z.object({ branchId: z.string() }),
  BranchClosureCreated: z.object({ branchId: z.string() }),
  BranchClosureDeleted: z.object({ branchId: z.string() }),
  TaxRateCreated: z.object({ name: z.string() }),
  TaxRateUpdated: anyPayload,

  // ── services ──────────────────────────────────────────────────────────────
  ServiceCreated: z.object({ name: z.string() }),
  ServiceUpdated: anyPayload,
  ServiceDeactivated: z.object({ serviceId: z.string() }),

  // ── stylists ──────────────────────────────────────────────────────────────
  StylistProfileCreated: z.object({ userId: z.string(), branchId: z.string() }),
  StylistProfileUpdated: anyPayload,
  StylistStatusChanged: z.object({
    stylistId: z.string(),
    status: z.string(),
  }),
  StylistServiceUpdated: z.object({ stylistId: z.string() }),

  // ── staff ─────────────────────────────────────────────────────────────────
  StaffInvited: z.object({ email: z.string(), roleId: z.string() }),
  StaffJoined: z.object({ userId: z.string() }),
  StaffRoleChanged: z.object({ targetUserId: z.string() }).passthrough(),
  StaffDeactivated: z.object({ userId: z.string() }),

  // ── rbac ──────────────────────────────────────────────────────────────────
  RoleCreated: z.object({ name: z.string() }).passthrough(),
  RoleUpdated: anyPayload,
  RoleDeleted: anyPayload,
  RoleAssigned: z.object({ targetUserId: z.string(), roleId: z.string() }),

  // ── customer identity (customer-auth phase) ───────────────────────────────
  CustomerRegistered: z.object({ customerId: z.string() }),
  CustomerVerified: z.object({ customerId: z.string() }),

  // ── queue ─────────────────────────────────────────────────────────────────
  QueueJoined: z.object({ entryId: z.string(), branchId: z.string() }),
  QueueAssigned: z.object({ entryId: z.string(), branchId: z.string() }),
  QueueServiceStarted: z.object({ entryId: z.string(), branchId: z.string() }),
  QueueCompleted: z.object({ entryId: z.string(), branchId: z.string() }),
  QueueLeft: z.object({ entryId: z.string(), branchId: z.string() }),

  // ── appointments ──────────────────────────────────────────────────────────
  AppointmentBooked: appointmentPayload,
  AppointmentArrived: appointmentPayload,
  AppointmentStarted: appointmentPayload,
  AppointmentCompleted: appointmentPayload,
  AppointmentNoShow: appointmentPayload,
  AppointmentCancelled: appointmentPayload,

  // ── tickets (POS) ─────────────────────────────────────────────────────────
  TicketOpened: z.object({ ticketId: z.string(), branchId: z.string() }),
  TicketLineAdded: z.object({ ticketId: z.string(), lineId: z.string() }),
  DiscountApplied: z.object({
    ticketId: z.string(),
    discountMinor: z.number(),
  }),
  TicketVoided: z.object({ ticketId: z.string(), totalMinor: z.number() }),

  // ── customers (CRM) ───────────────────────────────────────────────────────
  CustomerCreated: z.object({ name: z.string() }),
  CustomerVisitRecorded: z.object({
    customerId: z.string(),
    spendMinor: z.number(),
  }),
} as const satisfies Record<string, z.ZodTypeAny>;

export type EventType = keyof typeof EVENT_REGISTRY;

export function isEventType(value: string): value is EventType {
  return value in EVENT_REGISTRY;
}

/** Throws if the type is unregistered; otherwise validates the payload against
 *  its schema and returns the parsed payload. */
export function assertRegistered(
  type: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (!isEventType(type)) {
    throw new Error(
      `Unregistered domain event "${type}". Add it to EVENT_REGISTRY.`,
    );
  }
  const schema = EVENT_REGISTRY[type];
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `Invalid payload for domain event "${type}": ${parsed.error.message}`,
    );
  }
  return parsed.data as Record<string, unknown>;
}
