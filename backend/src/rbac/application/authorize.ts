import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { BranchMembershipsRepo } from '../data/branch-memberships.repo.js';
import { MembershipsRepo } from '../data/memberships.repo.js';
import { RolesRepo } from '../data/roles.repo.js';
import { OWNER_ROLE_NAME } from '../standard-roles.js';
import type { PermissionKey } from '../permission-catalog.js';
import type { ResourceContext } from '../resource-context.js';

/**
 * The single authorization check. EVERY Application-layer function that mutates
 * or does a scoped read calls `check()` first (architecture.md §3, §7). Runs
 * inside a tenant scope whose `app.user_id` is set — that is what makes the
 * membership lookup (RLS-guarded) return the caller's own row.
 */
@Injectable()
export class Authorize {
  constructor(
    private readonly memberships: MembershipsRepo,
    private readonly branchMemberships: BranchMembershipsRepo,
    private readonly roles: RolesRepo,
  ) {}

  /** Throws {@link ForbiddenException} if the caller may not do this. */
  async check(
    user: AuthUser,
    permission: PermissionKey,
    ctx: ResourceContext,
  ): Promise<void> {
    if (!(await this.can(user, permission, ctx))) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
  }

  /** Non-throwing form — for endpoints that mirror permissions to the UI. */
  async can(
    user: AuthUser,
    permission: PermissionKey,
    ctx: ResourceContext,
  ): Promise<boolean> {
    const membership = await this.memberships.findForUser(
      ctx.salonId,
      user.id,
    );
    if (!membership) return false;

    if (membership.roleIsStandard && membership.roleName === OWNER_ROLE_NAME) {
      return true;
    }

    const role = await this.roles.findById(ctx.salonId, membership.roleId);
    const grant = role?.grants.find((g) => g.permissionKey === permission);
    if (!grant) return false;
    if (grant.scope === 'org') return true;

    // A branch-scoped grant satisfies only a branch-level action, and only for a
    // branch the caller belongs to.
    if (!ctx.branchId) return false;
    return this.branchMemberships.isMemberOfBranch(
      ctx.salonId,
      user.id,
      ctx.branchId,
    );
  }

  /** The caller's role name in a salon, or null if they are not a member.
   *  Used by endpoints that need to show "you are the Manager here". */
  async roleNameFor(user: AuthUser, salonId: string): Promise<string | null> {
    const membership = await this.memberships.findForUser(salonId, user.id);
    return membership?.roleName ?? null;
  }
}
