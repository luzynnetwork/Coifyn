import { listRoles as apiListRoles, type RoleView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list roles" call. */
export function listRoles(): Promise<RoleView[]> {
  return apiListRoles();
}
