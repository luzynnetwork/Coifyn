import {
  removeQueue as apiRemoveQueue,
  type QueueEntryView,
  type RemoveQueueInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "remove queue entry" call. */
export function removeQueue(id: string, input: RemoveQueueInput): Promise<QueueEntryView> {
  return apiRemoveQueue(id, input);
}
