/**
 * Staff wire types, mirrored from backend/src/staff (dto + application) and
 * backend/src/rbac/application/list-members.ts.
 */

export type StaffInviteStatus = "pending" | "accepted" | "revoked" | "expired";

/** `staff_invite` row, returned by GET /staff/invites and POST /staff/invites. */
export interface StaffInviteView {
  id: string;
  salonId: string;
  email: string;
  roleId: string;
  branchIds: string[];
  /** The single-use accept token (also sent by email). */
  token: string;
  status: StaffInviteStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInviteInput {
  email: string;
  roleId: string;
  /** Branch UUIDs the invitee gets access to (max 50). */
  branchIds: string[];
}

/** GET /staff/invites/:token (public). */
export interface StaffInviteResolveView {
  email: string;
  roleId: string;
  branchIds: string[];
  expiresAt: string;
}

export interface AcceptStaffInviteInput {
  /** 10-200 chars. */
  password: string;
  /** Required by the server only when the invited email has no account yet. */
  displayName?: string;
}

/** POST /staff/invites/:token/accept response. */
export interface AcceptStaffInviteResult {
  userId: string;
  tokens: { accessToken: string; refreshToken: string; expiresIn: string };
}

/** GET /staff row. The backend does not expose whether the user is active. */
export interface StaffMemberView {
  userId: string;
  email: string | null;
  displayName: string | null;
  roleId: string;
  roleName: string;
  roleIsStandard: boolean;
  branchIds: string[];
}

export interface UpdateStaffInput {
  roleId?: string;
  /** Replaces the user's branch memberships (max 50). */
  branchIds?: string[];
  /** false deactivates the login; the last Owner cannot be deactivated. */
  active?: boolean;
}

/** PATCH /staff/:userId response. */
export interface UpdateStaffResult {
  ok: true;
}
