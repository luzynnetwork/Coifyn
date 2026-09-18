import { baseFetch } from "../http/base-fetch";
import type { BranchClosureView, CreateBranchClosureInput } from "./types";

/** POST /branches/:id/closures */
export function createBranchClosure(
  branchId: string,
  input: CreateBranchClosureInput,
): Promise<BranchClosureView> {
  return baseFetch<BranchClosureView>(`/branches/${branchId}/closures`, {
    method: "POST",
    body: input,
  });
}
