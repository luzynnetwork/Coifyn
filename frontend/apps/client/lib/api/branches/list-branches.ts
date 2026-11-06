import { listBranches as apiListBranches, type BranchView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list branches" call. */
export function listBranches(): Promise<BranchView[]> {
  return apiListBranches();
}
