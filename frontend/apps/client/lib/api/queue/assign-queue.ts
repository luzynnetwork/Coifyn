import {
  assignQueue as apiAssignQueue,
  type AssignQueueInput,
  type QueueEntryView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "assign queue entry" call. */
export function assignQueue(id: string, input: AssignQueueInput): Promise<QueueEntryView> {
  return apiAssignQueue(id, input);
}
