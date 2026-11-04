import { baseFetch } from "../http/base-fetch";
import type { AssignQueueInput, QueueEntryView } from "./types";

/** POST /queue/:id/assign */
export function assignQueue(id: string, input: AssignQueueInput): Promise<QueueEntryView> {
  return baseFetch<QueueEntryView>(`/queue/${id}/assign`, { method: "POST", body: input });
}
