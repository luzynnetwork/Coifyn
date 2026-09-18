import {
  setBranchHours as apiSetBranchHours,
  type BranchHoursView,
  type SetBranchHoursInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "set branch hours" call. */
export function setBranchHours(
  branchId: string,
  input: SetBranchHoursInput,
): Promise<BranchHoursView> {
  return apiSetBranchHours(branchId, input);
}
