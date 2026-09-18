import {
  getQueueWaitEstimate as apiGetQueueWaitEstimate,
  type WaitEstimateView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "queue wait estimate" call. */
export function getQueueWaitEstimate(id: string): Promise<WaitEstimateView> {
  return apiGetQueueWaitEstimate(id);
}
