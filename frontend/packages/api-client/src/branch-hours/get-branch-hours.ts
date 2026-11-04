import { baseFetch } from "../http/base-fetch";
import type { BranchHoursView } from "./types";

/** GET /branches/:id/hours returns one row per stored weekday. */
export function getBranchHours(branchId: string): Promise<BranchHoursView[]> {
  return baseFetch<BranchHoursView[]>(`/branches/${branchId}/hours`);
}
