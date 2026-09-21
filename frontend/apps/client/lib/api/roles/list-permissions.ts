import { listPermissions as apiListPermissions, type PermissionGroupView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list permissions" call. */
export function listPermissions(): Promise<PermissionGroupView[]> {
  return apiListPermissions();
}
