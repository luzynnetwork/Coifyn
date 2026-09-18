import { baseFetch } from "../http/base-fetch";
import type { AcceptStaffInviteInput, StaffMemberView } from "./types";

/** POST /staff/invites/:token/accept (public) */
export function acceptStaffInvite(
  token: string,
  input: AcceptStaffInviteInput,
): Promise<StaffMemberView> {
  return baseFetch<StaffMemberView>(`/staff/invites/${token}/accept`, {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
