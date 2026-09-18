import { baseFetch } from "../http/base-fetch";
import type { CreateRoleInput, RoleView } from "./types";

/** POST /roles */
export function createRole(input: CreateRoleInput): Promise<RoleView> {
  return baseFetch<RoleView>("/roles", { method: "POST", body: input });
}
