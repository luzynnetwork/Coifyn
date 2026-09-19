import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordService } from '../../auth/lib/password.js';
import { UsersRepo } from '../../auth/data/users.repo.js';
import {
  IssueSession,
  type AuthTokens,
  type SessionContext,
} from '../../auth/application/issue-session.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { BranchMembershipsRepo } from '../../rbac/data/branch-memberships.repo.js';
import { MembershipsRepo } from '../../rbac/data/memberships.repo.js';
import { StaffInvitesRepo } from '../data/staff-invites.repo.js';
import type { AcceptStaffInviteDto } from '../dto/accept-invite.dto.js';

/**
 * Resolves a token into a live membership. Reuses UsersRepo + PasswordService
 * for account creation exactly like auth's Register flow (no duplicated
 * hashing logic), and IssueSession for the resulting token pair — the invitee
 * ends this call signed in.
 *
 * Runs entirely under `withSystem()`: no salon/identity is known yet, and the
 * membership write is cross-tenant from the caller's point of view.
 */
@Injectable()
export class AcceptStaffInvite {
  constructor(
    private readonly database: DatabaseService,
    private readonly invites: StaffInvitesRepo,
    private readonly users: UsersRepo,
    private readonly passwords: PasswordService,
    private readonly memberships: MembershipsRepo,
    private readonly branchMemberships: BranchMembershipsRepo,
    private readonly issueSession: IssueSession,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(
    token: string,
    dto: AcceptStaffInviteDto,
    ctx: SessionContext,
  ): Promise<{ userId: string; tokens: AuthTokens }> {
    const outcome = await this.database.withSystem(async () => {
      const invite = await this.invites.findByToken(token);
      if (!invite) throw new NotFoundException('Invite not found.');
      if (invite.status !== 'pending' || invite.expiresAt < new Date()) {
        throw new GoneException('This invite is no longer valid.');
      }

      let user = await this.users.findByEmail(invite.email);
      if (user) {
        const valid = await this.passwords.verify(user.passwordHash, dto.password);
        if (!valid) {
          throw new UnauthorizedException(
            'Incorrect password for the existing account with this email.',
          );
        }
      } else {
        if (!dto.displayName) {
          throw new ConflictException(
            'displayName is required to create a new account.',
          );
        }
        const passwordHash = await this.passwords.hash(dto.password);
        user = await this.users.create({
          email: invite.email,
          passwordHash,
          displayName: dto.displayName,
        });
      }

      const existingMembership = await this.memberships.findForUser(
        invite.salonId,
        user.id,
      );
      if (existingMembership) {
        throw new ConflictException('Already a member of this salon.');
      }

      await this.memberships.create({
        salonId: invite.salonId,
        userId: user.id,
        roleId: invite.roleId,
      });
      const branchIds = (invite.branchIds as string[]) ?? [];
      await this.branchMemberships.replaceForUser(
        invite.salonId,
        user.id,
        branchIds,
      );
      await this.invites.setStatus(invite.id, 'accepted');

      await this.events.emit({
        aggregateType: 'staff_invite',
        aggregateId: invite.id,
        type: 'StaffJoined',
        salonId: invite.salonId,
        payload: { userId: user.id },
      });
      await this.audit.write({
        salonId: invite.salonId,
        actor: { system: true },
        action: 'staff.joined',
        targetType: 'user',
        targetId: user.id,
        after: { roleId: invite.roleId, branchIds },
      });

      return user;
    });

    const tokens = await this.issueSession.forNewSession(outcome, ctx);
    return { userId: outcome.id, tokens };
  }
}
