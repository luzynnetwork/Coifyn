import { assignRole as apiAssignRole } from "@coifyn/api-client";

/** Thin wrapper around the shared "assign role" call. */
export function assignRole(userId: string, roleId: string): Promise<void> {
  return apiAssignRole(userId, roleId);
}
