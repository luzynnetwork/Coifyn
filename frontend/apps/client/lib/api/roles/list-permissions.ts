import { listPermissions as apiListPermissions, type PermissionView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list permissions" call. */
export function listPermissions(): Promise<PermissionView[]> {
  return apiListPermissions();
}
