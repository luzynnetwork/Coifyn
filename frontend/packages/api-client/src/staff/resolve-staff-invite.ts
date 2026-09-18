import { baseFetch } from "../http/base-fetch";
import type { StaffInviteResolveView } from "./types";

/** GET /staff/invites/:token (public) */
export function resolveStaffInvite(token: string): Promise<StaffInviteResolveView> {
  return baseFetch<StaffInviteResolveView>(`/staff/invites/${token}`, {
    authenticated: false,
  });
}
