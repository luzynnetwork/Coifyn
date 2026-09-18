import { baseFetch } from "../http/base-fetch";
import type { QueueEntryView } from "./types";

/** GET /queue?branchId */
export function listQueue(branchId: string): Promise<QueueEntryView[]> {
  return baseFetch<QueueEntryView[]>(`/queue?branchId=${branchId}`);
}
