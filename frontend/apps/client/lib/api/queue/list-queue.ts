import { listQueue as apiListQueue, type QueueEntryView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list queue" call. */
export function listQueue(branchId: string): Promise<QueueEntryView[]> {
  return apiListQueue(branchId);
}
