import { z } from 'zod';

/**
 * The typed registry of every notification type the system may raise, mirroring
 * events/event-registry.ts's shape. `implemented: false` lets a type be listed
 * (and its payload shape documented) before the feature that raises it exists,
 * while `assertImplemented` still refuses to emit it — a deliberate registry
 * change turns it on, never an ad-hoc string.
 */
export const NOTIFICATION_TYPES = {
  TestNotification: {
    implemented: true,
    payloadSchema: z.object({ message: z.string() }),
  },
  BookingReminder: {
    implemented: false,
    payloadSchema: z.record(z.string(), z.unknown()),
  },
} as const satisfies Record<
  string,
  { implemented: boolean; payloadSchema: z.ZodTypeAny }
>;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export function isNotificationType(value: string): value is NotificationType {
  return value in NOTIFICATION_TYPES;
}

/** Throws if the type is unregistered or not yet implemented; otherwise
 *  validates the payload against its schema and returns the parsed payload. */
export function assertImplemented(
  type: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (!isNotificationType(type)) {
    throw new Error(
      `Unregistered notification type "${type}". Add it to NOTIFICATION_TYPES.`,
    );
  }
  const entry = NOTIFICATION_TYPES[type];
  if (!entry.implemented) {
    throw new Error(
      `Notification type "${type}" is registered but not yet implemented.`,
    );
  }
  const parsed = entry.payloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `Invalid payload for notification "${type}": ${parsed.error.message}`,
    );
  }
  return parsed.data as Record<string, unknown>;
}
