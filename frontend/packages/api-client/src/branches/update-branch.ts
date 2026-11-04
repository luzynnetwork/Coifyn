import { baseFetch } from "../http/base-fetch";
import type { BranchView, UpdateBranchInput } from "./types";

/** PATCH /branches/:id */
export function updateBranch(id: string, input: UpdateBranchInput): Promise<BranchView> {
  return baseFetch<BranchView>(`/branches/${id}`, { method: "PATCH", body: input });
}
