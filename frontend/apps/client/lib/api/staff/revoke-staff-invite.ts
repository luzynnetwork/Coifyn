import { revokeStaffInvite as apiRevokeStaffInvite } from "@coifyn/api-client";

/** Thin wrapper around the shared "revoke staff invite" call. */
export function revokeStaffInvite(id: string): Promise<void> {
  return apiRevokeStaffInvite(id);
}
