/** Role & permission wire types, mirrored from backend/src/rbac. */

export interface PermissionView {
  key: string;
  resource: string;
  action: string;
  description: string;
  scopable: boolean;
}

export interface RoleGrant {
  permissionKey: string;
  scope: "org" | "branch";
}

export interface RoleView {
  id: string;
  salonId: string;
  name: string;
  isStandard: boolean;
  grants: RoleGrant[];
  createdAt: string;
}

export interface CreateRoleInput {
  name: string;
  grants: RoleGrant[];
}

export interface UpdateRoleInput {
  name?: string;
  grants?: RoleGrant[];
}
