import { deleteBranch as apiDeleteBranch } from "@coifyn/api-client";

/** Thin wrapper around the shared "delete branch" call. */
export function deleteBranch(id: string): Promise<void> {
  return apiDeleteBranch(id);
}
