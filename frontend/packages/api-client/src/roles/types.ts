/** Role & permission wire types, mirrored from backend/src/rbac. */

export interface PermissionView {
  key: string;
  action: string;
  description: string;
  scopable: boolean;
}

/** GET /permissions returns the catalog grouped by resource. */
export interface PermissionGroupView {
  resource: string;
  permissions: PermissionView[];
}

export interface RoleGrant {
  permissionKey: string;
  scope: "org" | "branch";
}

/** GET /roles row: the `role` table plus its grants. */
export interface RoleView {
  id: string;
  salonId: string;
  name: string;
  isStandard: boolean;
  grants: RoleGrant[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateRoleInput {
  /** 2-60 chars. */
  name: string;
  grants: RoleGrant[];
}

/** PATCH /roles/:id: the backend DTO requires BOTH fields on every update. */
export interface UpdateRoleInput {
  name: string;
  grants: RoleGrant[];
}

/** POST /roles response. */
export interface CreateRoleResult {
  id: string;
}
