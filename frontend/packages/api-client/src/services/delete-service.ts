import { baseFetch } from "../http/base-fetch";

/** DELETE /services/:id */
export function deleteService(id: string): Promise<void> {
  return baseFetch<void>(`/services/${id}`, { method: "DELETE" });
}
