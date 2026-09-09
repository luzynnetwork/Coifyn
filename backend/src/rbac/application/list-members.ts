import { ForbiddenException, Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { users } from '../../persistence/schema/index.js';
import { BranchMembershipsRepo } from '../data/branch-memberships.repo.js';
import { MembershipsRepo } from '../data/memberships.repo.js';
import { Authorize } from './authorize.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';

/** The salon's people, with role and branch memberships. Any member may view. */
@Injectable()
export class ListMembers {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly memberships: MembershipsRepo,
    private readonly branchMemberships: BranchMembershipsRepo,
  ) {}

  async execute(user: AuthUser) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.authorize.roleNameFor(user, salonId))) {
        throw new ForbiddenException('Not a member of this salon.');
      }
      const members = await this.memberships.listForSalon(salonId);
      if (members.length === 0) return [];

      const userRows = await this.database.db.query.users.findMany({
        where: inArray(
          users.id,
          members.map((m) => m.userId),
        ),
      });
      const byId = new Map(userRows.map((u) => [u.id, u]));

      return Promise.all(
        members.map(async (m) => ({
          userId: m.userId,
          email: byId.get(m.userId)?.email ?? null,
          displayName: byId.get(m.userId)?.displayName ?? null,
          roleId: m.roleId,
          roleName: m.roleName,
          roleIsStandard: m.roleIsStandard,
          branchIds: await this.branchMemberships.branchIdsForUser(
            salonId,
            m.userId,
          ),
        })),
      );
    });
  }
}
