import { baseFetch } from "../http/base-fetch";
import type { QueueEntryView } from "./types";

/** POST /queue/:id/start */
export function startQueue(id: string): Promise<QueueEntryView> {
  return baseFetch<QueueEntryView>(`/queue/${id}/start`, { method: "POST" });
}
