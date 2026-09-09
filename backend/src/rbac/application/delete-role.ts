import {
  ConflictException,
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
import { Authorize } from './authorize.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';

@Injectable()
export class DeleteRole {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly roles: RolesRepo,
    private readonly memberships: MembershipsRepo,
    private readonly audit: AuditWriter,
    private readonly events: EventBus,
  ) {}

  async execute(user: AuthUser, roleId: string): Promise<void> {
    const salonId = await this.salon.execute(user);

    await this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'role:delete', { salonId });

      const role = await this.roles.findById(salonId, roleId);
      if (!role) throw new NotFoundException('Role not found.');
      if (role.isStandard) {
        throw new ForbiddenException('Standard roles cannot be deleted.');
      }

      const inUse = await this.memberships.countByRole(salonId, roleId);
      if (inUse > 0) {
        throw new ConflictException(
          `${inUse} member(s) still have this role — reassign them first.`,
        );
      }

      await this.roles.delete(salonId, roleId);
      await this.events.emit({
        aggregateType: 'role',
        aggregateId: roleId,
        type: 'RoleDeleted',
        salonId,
        payload: { name: role.name },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'role.deleted',
        targetType: 'role',
        targetId: roleId,
        before: { name: role.name },
      });
    });
  }
}
