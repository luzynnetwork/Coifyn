import { baseFetch } from "../http/base-fetch";
import type { QueueEntryView } from "./types";

/** POST /queue/:id/complete */
export function completeQueue(id: string): Promise<QueueEntryView> {
  return baseFetch<QueueEntryView>(`/queue/${id}/complete`, { method: "POST" });
}
