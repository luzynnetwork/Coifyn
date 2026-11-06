import {
  createBranchClosure as apiCreateBranchClosure,
  type BranchClosureView,
  type CreateBranchClosureInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create branch closure" call. */
export function createBranchClosure(
  branchId: string,
  input: CreateBranchClosureInput,
): Promise<BranchClosureView> {
  return apiCreateBranchClosure(branchId, input);
}
