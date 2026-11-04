import { baseFetch } from "../http/base-fetch";

/** DELETE /roles/:id */
export function deleteRole(id: string): Promise<void> {
  return baseFetch<void>(`/roles/${id}`, { method: "DELETE" });
}
