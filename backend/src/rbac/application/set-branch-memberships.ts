import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { branches } from '../../persistence/schema/index.js';
import { BranchMembershipsRepo } from '../data/branch-memberships.repo.js';
import { MembershipsRepo } from '../data/memberships.repo.js';
import { Authorize } from './authorize.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';

/** Sets which branches a member belongs to — the "own branch" scope every
 *  branch-scoped grant is evaluated against. */
@Injectable()
export class SetBranchMemberships {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly memberships: MembershipsRepo,
    private readonly branchMemberships: BranchMembershipsRepo,
    private readonly audit: AuditWriter,
  ) {}

  async execute(
    user: AuthUser,
    targetUserId: string,
    branchIds: string[],
  ): Promise<void> {
    const salonId = await this.salon.execute(user);
    const unique = [...new Set(branchIds)];

    await this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'staff:manage', { salonId });

      if (!(await this.memberships.findForUser(salonId, targetUserId))) {
        throw new NotFoundException('That person is not a member of this salon.');
      }

      const found = await this.database.db
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(eq(branches.salonId, salonId), inArray(branches.id, unique)),
        );
      if (found.length !== unique.length) {
        throw new BadRequestException(
          'One or more branches do not belong to this salon.',
        );
      }

      await this.branchMemberships.replaceForUser(
        salonId,
        targetUserId,
        unique,
      );
      await this.audit.write({
        salonId,
        actor: user,
        action: 'member.branches_set',
        targetType: 'user',
        targetId: targetUserId,
        after: { branchIds: unique },
      });
    });
  }
}
