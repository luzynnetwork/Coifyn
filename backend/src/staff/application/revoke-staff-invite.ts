import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { StaffInvitesRepo } from '../data/staff-invites.repo.js';

@Injectable()
export class RevokeStaffInvite {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly invites: StaffInvitesRepo,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string): Promise<void> {
    const salonId = await this.salon.execute(user);
    await this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'staff:invite', { salonId });

      const invite = await this.invites.findById(salonId, id);
      if (!invite) throw new NotFoundException('Invite not found.');
      if (invite.status !== 'pending') {
        throw new ConflictException('Only a pending invite can be revoked.');
      }

      await this.invites.setStatus(id, 'revoked');
      await this.audit.write({
        salonId,
        actor: user,
        action: 'staff.invite_revoked',
        targetType: 'staff_invite',
        targetId: id,
        before: { status: invite.status },
        after: { status: 'revoked' },
      });
    });
  }
}
