import { baseFetch } from "../http/base-fetch";
import type { ChairView } from "./types";

/** GET /branches/:branchId/chairs */
export function listChairs(branchId: string): Promise<ChairView[]> {
  return baseFetch<ChairView[]>(`/branches/${branchId}/chairs`);
}
