import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { MembershipsRepo } from '../data/memberships.repo.js';
import { RolesRepo } from '../data/roles.repo.js';
import { OWNER_ROLE_NAME } from '../standard-roles.js';
import { Authorize } from './authorize.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';

/**
 * Sets a member's role. Enforces the last-owner rule: the salon must always keep
 * at least one Owner, so the final Owner cannot be moved off the Owner role
 * until another Owner exists.
 */
@Injectable()
export class AssignRole {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly roles: RolesRepo,
    private readonly memberships: MembershipsRepo,
    private readonly audit: AuditWriter,
    private readonly events: EventBus,
  ) {}

  async execute(
    user: AuthUser,
    targetUserId: string,
    roleId: string,
  ): Promise<void> {
    const salonId = await this.salon.execute(user);

    await this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'role:assign', { salonId });

      const newRole = await this.roles.findById(salonId, roleId);
      if (!newRole) throw new NotFoundException('Role not found.');

      const current = await this.memberships.findForUser(
        salonId,
        targetUserId,
      );
      if (!current) {
        throw new NotFoundException('That person is not a member of this salon.');
      }
      if (current.roleId === roleId) return;

      const leavingOwner =
        current.roleIsStandard && current.roleName === OWNER_ROLE_NAME;
      if (leavingOwner) {
        const ownerRole = await this.roles.findByName(
          salonId,
          OWNER_ROLE_NAME,
        );
        const owners = ownerRole
          ? await this.memberships.countByRole(salonId, ownerRole.id)
          : 0;
        if (owners <= 1) {
          throw new ForbiddenException(
            'The salon must keep at least one Owner — assign another Owner first.',
          );
        }
      }

      await this.memberships.setRole(salonId, targetUserId, roleId);
      await this.events.emit({
        aggregateType: 'membership',
        aggregateId: targetUserId,
        type: 'RoleAssigned',
        salonId,
        payload: { targetUserId, roleId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'role.assigned',
        targetType: 'user',
        targetId: targetUserId,
        before: { roleId: current.roleId, roleName: current.roleName },
        after: { roleId, roleName: newRole.name },
      });
    });
  }
}
