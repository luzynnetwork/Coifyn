import { baseFetch } from "../http/base-fetch";
import type { BranchClosureView } from "./types";

/** GET /branches/:id/closures */
export function listBranchClosures(branchId: string): Promise<BranchClosureView[]> {
  return baseFetch<BranchClosureView[]>(`/branches/${branchId}/closures`);
}
