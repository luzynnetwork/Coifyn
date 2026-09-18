import { deleteRole as apiDeleteRole } from "@coifyn/api-client";

/** Thin wrapper around the shared "delete role" call. */
export function deleteRole(id: string): Promise<void> {
  return apiDeleteRole(id);
}
