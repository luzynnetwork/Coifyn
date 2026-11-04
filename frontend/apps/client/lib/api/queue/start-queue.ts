import { startQueue as apiStartQueue, type QueueEntryView } from "@coifyn/api-client";

/** Thin wrapper around the shared "start queue entry" call. */
export function startQueue(id: string): Promise<QueueEntryView> {
  return apiStartQueue(id);
}
