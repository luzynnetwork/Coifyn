import { baseFetch } from "../http/base-fetch";
import type { QueueEntryView } from "./types";

/** GET /queue?branchId returns active entries (waiting/assigned/in_service) with `position`. */
export function listQueue(branchId: string): Promise<QueueEntryView[]> {
  return baseFetch<QueueEntryView[]>(`/queue?branchId=${encodeURIComponent(branchId)}`);
}
