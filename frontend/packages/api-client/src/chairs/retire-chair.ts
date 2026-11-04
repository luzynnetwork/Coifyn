import { baseFetch } from "../http/base-fetch";

/** DELETE /chairs/:id (retires the chair) */
export function retireChair(id: string): Promise<void> {
  return baseFetch<void>(`/chairs/${id}`, { method: "DELETE" });
}
