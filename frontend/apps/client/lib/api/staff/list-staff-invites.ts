import { listStaffInvites as apiListStaffInvites, type StaffInviteView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list staff invites" call. */
export function listStaffInvites(): Promise<StaffInviteView[]> {
  return apiListStaffInvites();
}
