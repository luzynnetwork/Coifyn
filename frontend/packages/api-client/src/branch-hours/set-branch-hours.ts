import { baseFetch } from "../http/base-fetch";
import type { BranchHoursView, SetBranchHoursInput } from "./types";

/** PUT /branches/:id/hours replaces the week and returns the stored rows. */
export function setBranchHours(
  branchId: string,
  input: SetBranchHoursInput,
): Promise<BranchHoursView[]> {
  return baseFetch<BranchHoursView[]>(`/branches/${branchId}/hours`, {
    method: "PUT",
    body: input,
  });
}
