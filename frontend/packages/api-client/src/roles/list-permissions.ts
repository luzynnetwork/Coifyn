import { baseFetch } from "../http/base-fetch";
import type { PermissionGroupView } from "./types";

/** GET /permissions */
export function listPermissions(): Promise<PermissionGroupView[]> {
  return baseFetch<PermissionGroupView[]>("/permissions");
}
