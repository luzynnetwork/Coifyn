import {
  updateBranch as apiUpdateBranch,
  type BranchView,
  type UpdateBranchInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update branch" call. */
export function updateBranch(id: string, input: UpdateBranchInput): Promise<BranchView> {
  return apiUpdateBranch(id, input);
}
