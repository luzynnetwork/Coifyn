import {
  createBranch as apiCreateBranch,
  type BranchView,
  type CreateBranchInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create branch" call. */
export function createBranch(input: CreateBranchInput): Promise<BranchView> {
  return apiCreateBranch(input);
}
