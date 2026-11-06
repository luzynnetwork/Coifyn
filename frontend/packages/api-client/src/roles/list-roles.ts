import { baseFetch } from "../http/base-fetch";
import type { RoleView } from "./types";

/** GET /roles */
export function listRoles(): Promise<RoleView[]> {
  return baseFetch<RoleView[]>("/roles");
}
