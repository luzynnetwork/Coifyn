import { baseFetch } from "../http/base-fetch";
import type { UpdateRoleInput } from "./types";

/** PATCH /roles/:id */
export function updateRole(id: string, input: UpdateRoleInput): Promise<void> {
  return baseFetch<void>(`/roles/${id}`, { method: "PATCH", body: input });
}
