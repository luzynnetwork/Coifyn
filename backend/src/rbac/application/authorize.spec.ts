import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import type { BranchMembershipsRepo } from '../data/branch-memberships.repo.js';
import type { MembershipsRepo } from '../data/memberships.repo.js';
import type { RolesRepo } from '../data/roles.repo.js';
import { Authorize } from './authorize.js';

const user: AuthUser = {
  id: 'u1',
  email: 'e',
  displayName: 'd',
  sessionId: 's',
};
const SALON = 'salon1';

function build(opts: {
  role?: { name: string; isStandard: boolean; roleId: string };
  grants?: { permissionKey: string; scope: 'org' | 'branch' }[];
  branchMember?: boolean;
}) {
  const memberships = {
    findForUser: async () =>
      opts.role
        ? {
            roleId: opts.role.roleId,
            roleName: opts.role.name,
            roleIsStandard: opts.role.isStandard,
          }
        : undefined,
  } as unknown as MembershipsRepo;

  const roles = {
    findById: async () => ({ grants: opts.grants ?? [] }),
  } as unknown as RolesRepo;

  const branchMemberships = {
    isMemberOfBranch: async () => opts.branchMember ?? false,
  } as unknown as BranchMembershipsRepo;

  return new Authorize(memberships, branchMemberships, roles);
}

describe('Authorize', () => {
  it('allows the Owner everything without checking grants', async () => {
    const authz = build({
      role: { name: 'Owner', isStandard: true, roleId: 'r-owner' },
    });
    await expect(
      authz.check(user, 'salon:update', { salonId: SALON }),
    ).resolves.toBeUndefined();
  });

  it('denies a user with no membership', async () => {
    const authz = build({});
    expect(await authz.can(user, 'service:view', { salonId: SALON })).toBe(
      false,
    );
  });

  it('allows an org-scoped grant', async () => {
    const authz = build({
      role: { name: 'Manager', isStandard: true, roleId: 'r1' },
      grants: [{ permissionKey: 'service:manage', scope: 'org' }],
    });
    expect(
      await authz.can(user, 'service:manage', { salonId: SALON }),
    ).toBe(true);
  });

  it('allows a branch-scoped grant only for a branch the user belongs to', async () => {
    const authz = build({
      role: { name: 'Stylist', isStandard: true, roleId: 'r2' },
      grants: [{ permissionKey: 'queue:manage', scope: 'branch' }],
      branchMember: true,
    });
    expect(
      await authz.can(user, 'queue:manage', {
        salonId: SALON,
        branchId: 'b1',
      }),
    ).toBe(true);
  });

  it('denies a branch-scoped grant for a branch the user is not on', async () => {
    const authz = build({
      role: { name: 'Stylist', isStandard: true, roleId: 'r2' },
      grants: [{ permissionKey: 'queue:manage', scope: 'branch' }],
      branchMember: false,
    });
    expect(
      await authz.can(user, 'queue:manage', {
        salonId: SALON,
        branchId: 'b1',
      }),
    ).toBe(false);
  });

  it('denies a branch-scoped grant for a salon-level action (no branch in context)', async () => {
    const authz = build({
      role: { name: 'X', isStandard: false, roleId: 'r3' },
      grants: [{ permissionKey: 'service:manage', scope: 'branch' }],
      branchMember: true,
    });
    expect(
      await authz.can(user, 'service:manage', { salonId: SALON }),
    ).toBe(false);
  });

  it('check() throws ForbiddenException when denied', async () => {
    const authz = build({
      role: { name: 'Stylist', isStandard: true, roleId: 'r2' },
      grants: [],
    });
    await expect(
      authz.check(user, 'role:create', { salonId: SALON }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
