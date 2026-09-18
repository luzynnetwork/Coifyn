import {
  createStaffInvite as apiCreateStaffInvite,
  type CreateStaffInviteInput,
  type StaffInviteView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create staff invite" call. */
export function createStaffInvite(input: CreateStaffInviteInput): Promise<StaffInviteView> {
  return apiCreateStaffInvite(input);
}
