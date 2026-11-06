import { baseFetch } from "../http/base-fetch";
import type { CreateRoleInput, CreateRoleResult } from "./types";

/** POST /roles (returns only the new role id) */
export function createRole(input: CreateRoleInput): Promise<CreateRoleResult> {
  return baseFetch<CreateRoleResult>("/roles", { method: "POST", body: input });
}
