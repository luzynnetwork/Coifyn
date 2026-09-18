import { baseFetch } from "../http/base-fetch";
import type { BranchHoursView } from "./types";

/** GET /branches/:id/hours */
export function getBranchHours(branchId: string): Promise<BranchHoursView> {
  return baseFetch<BranchHoursView>(`/branches/${branchId}/hours`);
}
