import { baseFetch } from "../http/base-fetch";
import type { AcceptStaffInviteInput, AcceptStaffInviteResult } from "./types";

/** POST /staff/invites/:token/accept (public) */
export function acceptStaffInvite(
  token: string,
  input: AcceptStaffInviteInput,
): Promise<AcceptStaffInviteResult> {
  return baseFetch<AcceptStaffInviteResult>(`/staff/invites/${token}/accept`, {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
