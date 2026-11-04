import { baseFetch } from "../http/base-fetch";
import type { StaffInviteView } from "./types";

/** GET /staff/invites */
export function listStaffInvites(): Promise<StaffInviteView[]> {
  return baseFetch<StaffInviteView[]>("/staff/invites");
}
