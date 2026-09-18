import { baseFetch } from "../http/base-fetch";
import type { PermissionView } from "./types";

/** GET /permissions */
export function listPermissions(): Promise<PermissionView[]> {
  return baseFetch<PermissionView[]>("/permissions");
}
