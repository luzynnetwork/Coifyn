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

  // ── rbac ──────────────────────────────────────────────────────────────────
  RoleCreated: z.object({ name: z.string() }).passthrough(),
  RoleUpdated: anyPayload,
  RoleDeleted: anyPayload,
  RoleAssigned: z.object({ targetUserId: z.string(), roleId: z.string() }),

  // ── customer identity (customer-auth phase) ───────────────────────────────
  CustomerRegistered: z.object({ customerId: z.string() }),
  CustomerVerified: z.object({ customerId: z.string() }),
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
