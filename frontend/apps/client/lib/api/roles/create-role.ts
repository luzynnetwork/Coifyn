import {
  createRole as apiCreateRole,
  type CreateRoleInput,
  type RoleView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create role" call. */
export function createRole(input: CreateRoleInput): Promise<RoleView> {
  return apiCreateRole(input);
}
