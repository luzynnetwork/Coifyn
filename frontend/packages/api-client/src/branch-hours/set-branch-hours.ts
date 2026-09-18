import { baseFetch } from "../http/base-fetch";
import type { BranchHoursView, SetBranchHoursInput } from "./types";

/** PUT /branches/:id/hours */
export function setBranchHours(
  branchId: string,
  input: SetBranchHoursInput,
): Promise<BranchHoursView> {
  return baseFetch<BranchHoursView>(`/branches/${branchId}/hours`, {
    method: "PUT",
    body: input,
  });
}
