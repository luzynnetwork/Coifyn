import { baseFetch } from "../http/base-fetch";

/** DELETE /branches/:id */
export function deleteBranch(id: string): Promise<void> {
  return baseFetch<void>(`/branches/${id}`, { method: "DELETE" });
}
