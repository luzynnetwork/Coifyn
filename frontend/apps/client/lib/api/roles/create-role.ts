import {
  createRole as apiCreateRole,
  type CreateRoleInput,
  type CreateRoleResult,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create role" call. */
export function createRole(input: CreateRoleInput): Promise<CreateRoleResult> {
  return apiCreateRole(input);
}
