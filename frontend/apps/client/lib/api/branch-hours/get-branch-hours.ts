import { getBranchHours as apiGetBranchHours, type BranchHoursView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get branch hours" call. */
export function getBranchHours(branchId: string): Promise<BranchHoursView> {
  return apiGetBranchHours(branchId);
}
