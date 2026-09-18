import { completeQueue as apiCompleteQueue, type QueueEntryView } from "@coifyn/api-client";

/** Thin wrapper around the shared "complete queue entry" call. */
export function completeQueue(id: string): Promise<QueueEntryView> {
  return apiCompleteQueue(id);
}
