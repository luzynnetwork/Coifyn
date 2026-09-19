import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { StaffInvitesRepo } from '../data/staff-invites.repo.js';

/**
 * Public resolve — no JwtAuthGuard, no salon/identity yet, so it runs under
 * `withSystem()` like the outbox relay and webhook handlers do. Returns only
 * what the accept-flow UI needs to show ("X invites you to join as Y"), never
 * the raw token back.
 */
@Injectable()
export class GetStaffInviteByToken {
  constructor(
    private readonly database: DatabaseService,
    private readonly invites: StaffInvitesRepo,
  ) {}

  async execute(token: string) {
    const invite = await this.database.withSystem(() =>
      this.invites.findByToken(token),
    );
    if (!invite) throw new NotFoundException('Invite not found.');
    if (invite.status !== 'pending' || invite.expiresAt < new Date()) {
      throw new GoneException('This invite is no longer valid.');
    }
    return {
      email: invite.email,
      roleId: invite.roleId,
      branchIds: invite.branchIds,
      expiresAt: invite.expiresAt,
    };
  }
}
