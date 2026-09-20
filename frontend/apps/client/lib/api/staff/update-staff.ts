import {
  updateStaff as apiUpdateStaff,
  type UpdateStaffInput,
  type UpdateStaffResult,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update staff" call. */
export function updateStaff(userId: string, input: UpdateStaffInput): Promise<UpdateStaffResult> {
  return apiUpdateStaff(userId, input);
}
