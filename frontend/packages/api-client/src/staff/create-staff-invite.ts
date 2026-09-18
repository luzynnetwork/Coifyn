import { baseFetch } from "../http/base-fetch";
import type { CreateStaffInviteInput, StaffInviteView } from "./types";

/** POST /staff/invites */
export function createStaffInvite(input: CreateStaffInviteInput): Promise<StaffInviteView> {
  return baseFetch<StaffInviteView>("/staff/invites", { method: "POST", body: input });
}
