import {
  joinQueue as apiJoinQueue,
  type JoinQueueInput,
  type QueueEntryView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "join queue" call. */
export function joinQueue(input: JoinQueueInput): Promise<QueueEntryView> {
  return apiJoinQueue(input);
}
