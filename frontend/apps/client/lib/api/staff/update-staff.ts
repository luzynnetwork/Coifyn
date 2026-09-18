import {
  updateStaff as apiUpdateStaff,
  type StaffMemberView,
  type UpdateStaffInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update staff" call. */
export function updateStaff(userId: string, input: UpdateStaffInput): Promise<StaffMemberView> {
  return apiUpdateStaff(userId, input);
}
