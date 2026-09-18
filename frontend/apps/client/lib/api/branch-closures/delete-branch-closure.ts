import { deleteBranchClosure as apiDeleteBranchClosure } from "@coifyn/api-client";

/** Thin wrapper around the shared "delete branch closure" call. */
export function deleteBranchClosure(id: string): Promise<void> {
  return apiDeleteBranchClosure(id);
}
