import { baseFetch } from "../http/base-fetch";
import type { StaffMemberView, UpdateStaffInput } from "./types";

/** PATCH /staff/:userId */
export function updateStaff(userId: string, input: UpdateStaffInput): Promise<StaffMemberView> {
  return baseFetch<StaffMemberView>(`/staff/${userId}`, { method: "PATCH", body: input });
}
