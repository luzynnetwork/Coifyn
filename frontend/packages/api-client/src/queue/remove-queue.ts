import { baseFetch } from "../http/base-fetch";
import type { QueueEntryView, RemoveQueueInput } from "./types";

/** POST /queue/:id/remove */
export function removeQueue(id: string, input: RemoveQueueInput): Promise<QueueEntryView> {
  return baseFetch<QueueEntryView>(`/queue/${id}/remove`, { method: "POST", body: input });
}
