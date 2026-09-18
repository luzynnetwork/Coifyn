/** Staff wire types — documented contract, see phases/phase-1-salon-core.md. */

export type StaffInviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface StaffInviteView {
  id: string;
  email: string;
  roleId: string;
  branchIds: string[];
  status: StaffInviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface CreateStaffInviteInput {
  email: string;
  roleId: string;
  branchIds: string[];
}

export interface StaffInviteResolveView {
  email: string;
  roleName: string;
  salonName: string;
  expiresAt: string;
}

export interface AcceptStaffInviteInput {
  password: string;
  displayName: string;
}

export interface StaffMemberView {
  userId: string;
  email: string;
  displayName: string;
  roleId: string;
  roleName: string;
  branchIds: string[];
  isActive: boolean;
}

export interface UpdateStaffInput {
  roleId?: string;
  branchIds?: string[];
  isActive?: boolean;
}
