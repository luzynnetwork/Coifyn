import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { UsersRepo } from '../../auth/data/users.repo.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { AssignRole } from '../../rbac/application/assign-role.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { SetBranchMemberships } from '../../rbac/application/set-branch-memberships.js';
import { MembershipsRepo } from '../../rbac/data/memberships.repo.js';
import { OWNER_ROLE_NAME } from '../../rbac/standard-roles.js';
import type { UpdateStaffDto } from '../dto/update-staff.dto.js';

/**
 * PATCH /staff/:userId — role and branch-membership changes delegate to
 * rbac's AssignRole / SetBranchMemberships (last-owner guard already lives
 * there, see AssignRole; each opens its own `withTenant` scope). `active`
 * toggles login via UsersRepo.setStatus and enforces the same last-owner rule
 * for deactivation, since a demoted-to-disabled Owner is functionally the
 * same loss as a demoted role.
 */
@Injectable()
export class UpdateStaff {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly memberships: MembershipsRepo,
    private readonly users: UsersRepo,
    private readonly assignRole: AssignRole,
    private readonly setBranchMemberships: SetBranchMemberships,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, targetUserId: string, dto: UpdateStaffDto) {
    const salonId = await this.salon.execute(user);

    if (dto.roleId) {
      await this.assignRole.execute(user, targetUserId, dto.roleId);
      // AssignRole already emits rbac's RoleAssigned + writes the audit row;
      // this module's own StaffRoleChanged event is emitted in addition so
      // `staff` subscribers don't need to know about the rbac aggregate.
      await this.database.withTenant(user.id, salonId, () =>
        this.events.emit({
          aggregateType: 'user',
          aggregateId: targetUserId,
          type: 'StaffRoleChanged',
          salonId,
          payload: { targetUserId, roleId: dto.roleId! },
        }),
      );
    }
    if (dto.branchIds) {
      await this.setBranchMemberships.execute(user, targetUserId, dto.branchIds);
    }

    if (dto.active === undefined) return { ok: true };

    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'staff:manage', { salonId });

      const membership = await this.memberships.findForUser(salonId, targetUserId);
      if (!membership) {
        throw new NotFoundException('That person is not a member of this salon.');
      }

      if (!dto.active && membership.roleIsStandard && membership.roleName === OWNER_ROLE_NAME) {
        const owners = await this.memberships.countByRole(salonId, membership.roleId);
        if (owners <= 1) {
          throw new ForbiddenException(
            'The salon must keep at least one Owner — assign another Owner first.',
          );
        }
      }

      await this.users.setStatus(targetUserId, dto.active ? 'active' : 'disabled');

      if (!dto.active) {
        await this.events.emit({
          aggregateType: 'user',
          aggregateId: targetUserId,
          type: 'StaffDeactivated',
          salonId,
          payload: { userId: targetUserId },
        });
      }
      await this.audit.write({
        salonId,
        actor: user,
        action: dto.active ? 'staff.reactivated' : 'staff.deactivated',
        targetType: 'user',
        targetId: targetUserId,
        after: { active: dto.active },
      });

      return { ok: true };
    });
  }
}
