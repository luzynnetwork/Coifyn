import { baseFetch } from "../http/base-fetch";

/** DELETE /branch-closures/:id */
export function deleteBranchClosure(id: string): Promise<void> {
  return baseFetch<void>(`/branch-closures/${id}`, { method: "DELETE" });
}
