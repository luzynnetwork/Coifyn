import { baseFetch } from "../http/base-fetch";
import type { WaitEstimateView } from "./types";

/** GET /queue/:id/wait-estimate */
export function getQueueWaitEstimate(id: string): Promise<WaitEstimateView> {
  return baseFetch<WaitEstimateView>(`/queue/${id}/wait-estimate`);
}
