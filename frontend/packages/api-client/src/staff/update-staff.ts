import { baseFetch } from "../http/base-fetch";
import type { UpdateStaffInput, UpdateStaffResult } from "./types";

/** PATCH /staff/:userId (role, branch memberships and/or active flag) */
export function updateStaff(userId: string, input: UpdateStaffInput): Promise<UpdateStaffResult> {
  return baseFetch<UpdateStaffResult>(`/staff/${userId}`, { method: "PATCH", body: input });
}
