import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacController } from './rbac.controller.js';
import { RbacBootstrap } from './rbac.bootstrap.js';
import { PermissionsRepo } from './data/permissions.repo.js';
import { RolesRepo } from './data/roles.repo.js';
import { MembershipsRepo } from './data/memberships.repo.js';
import { BranchMembershipsRepo } from './data/branch-memberships.repo.js';
import { Authorize } from './application/authorize.js';
import { ResolveCurrentSalon } from './application/resolve-current-salon.js';
import { ProvisionStandardRoles } from './application/provision-standard-roles.js';
import { ListPermissions } from './application/list-permissions.js';
import { ListRoles } from './application/list-roles.js';
import { CreateRole } from './application/create-role.js';
import { UpdateRole } from './application/update-role.js';
import { DeleteRole } from './application/delete-role.js';
import { ListMembers } from './application/list-members.js';
import { AssignRole } from './application/assign-role.js';
import { SetBranchMemberships } from './application/set-branch-memberships.js';

/**
 * RBAC — permissions are data. Exports the pieces feature modules need:
 * {@link Authorize} (the one check), {@link ResolveCurrentSalon}, the repos, and
 * {@link ProvisionStandardRoles} for salon onboarding.
 */
@Module({
  imports: [AuthModule],
  controllers: [RbacController],
  providers: [
    RbacBootstrap,
    PermissionsRepo,
    RolesRepo,
    MembershipsRepo,
    BranchMembershipsRepo,
    Authorize,
    ResolveCurrentSalon,
    ProvisionStandardRoles,
    ListPermissions,
    ListRoles,
    CreateRole,
    UpdateRole,
    DeleteRole,
    ListMembers,
    AssignRole,
    SetBranchMemberships,
  ],
  exports: [
    Authorize,
    ResolveCurrentSalon,
    ProvisionStandardRoles,
    RolesRepo,
    MembershipsRepo,
    BranchMembershipsRepo,
  ],
})
export class RbacModule {}
