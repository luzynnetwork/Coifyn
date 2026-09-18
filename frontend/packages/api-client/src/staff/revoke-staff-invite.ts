import { baseFetch } from "../http/base-fetch";

/** POST /staff/invites/:id/revoke */
export function revokeStaffInvite(id: string): Promise<void> {
  return baseFetch<void>(`/staff/invites/${id}/revoke`, { method: "POST" });
}
