import { randomBytes } from 'node:crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from '../../providers/notification-provider.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { RolesRepo } from '../../rbac/data/roles.repo.js';
import { StaffInvitesRepo } from '../data/staff-invites.repo.js';
import type { CreateStaffInviteDto } from '../dto/staff-invite.dto.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class CreateStaffInvite {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly invites: StaffInvitesRepo,
    private readonly roles: RolesRepo,
    @Inject(NOTIFICATION_PROVIDER)
    private readonly notifications: NotificationProvider,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateStaffInviteDto) {
    const salonId = await this.salon.execute(user);
    const invite = await this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'staff:invite', { salonId });

      const role = await this.roles.findById(salonId, dto.roleId);
      if (!role) throw new BadRequestException('roleId does not belong to this salon.');

      const created = await this.invites.create({
        salonId,
        email: dto.email.toLowerCase(),
        roleId: dto.roleId,
        branchIds: dto.branchIds,
        token: randomBytes(24).toString('base64url'),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      });

      await this.events.emit({
        aggregateType: 'staff_invite',
        aggregateId: created.id,
        type: 'StaffInvited',
        salonId,
        payload: { email: created.email, roleId: created.roleId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'staff.invited',
        targetType: 'staff_invite',
        targetId: created.id,
        after: { email: created.email, roleId: created.roleId },
      });

      return created;
    });

    // Phase 1 has no email templating yet — a plain message through whichever
    // NotificationProvider is bound (Console in dev, SES once MAIL_HOST is set).
    await this.notifications.send(invite.email, 'email', 'staff-invite', {
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
    });

    return invite;
  }
}
