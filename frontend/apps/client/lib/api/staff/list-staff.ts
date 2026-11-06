import { listStaff as apiListStaff, type StaffMemberView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list staff" call. */
export function listStaff(): Promise<StaffMemberView[]> {
  return apiListStaff();
}
