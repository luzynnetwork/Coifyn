import { updateRole as apiUpdateRole, type UpdateRoleInput } from "@coifyn/api-client";

/** Thin wrapper around the shared "update role" call. */
export function updateRole(id: string, input: UpdateRoleInput): Promise<void> {
  return apiUpdateRole(id, input);
}
