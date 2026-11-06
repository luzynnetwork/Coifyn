import {
  listBranchClosures as apiListBranchClosures,
  type BranchClosureView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "list branch closures" call. */
export function listBranchClosures(branchId: string): Promise<BranchClosureView[]> {
  return apiListBranchClosures(branchId);
}
