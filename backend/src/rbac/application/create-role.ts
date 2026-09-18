import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { RolesRepo } from '../data/roles.repo.js';
import { isPermissionKey, isScopable } from '../permission-catalog.js';
import type { CreateRoleDto } from '../dto/role.dto.js';
import { Authorize } from './authorize.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';

@Injectable()
export class CreateRole {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly roles: RolesRepo,
    private readonly audit: AuditWriter,
    private readonly events: EventBus,
  ) {}

  async execute(user: AuthUser, dto: CreateRoleDto): Promise<{ id: string }> {
    const salonId = await this.salon.execute(user);
    validateGrants(dto.grants);

    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'role:create', { salonId });

      if (await this.roles.findByName(salonId, dto.name)) {
        throw new ConflictException('A role with that name already exists.');
      }

      const id = await this.roles.create({
        salonId,
        name: dto.name,
        isStandard: false,
        grants: dto.grants,
      });

      await this.events.emit({
        aggregateType: 'role',
        aggregateId: id,
        type: 'RoleCreated',
        salonId,
        payload: { name: dto.name },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'role.created',
        targetType: 'role',
        targetId: id,
        after: { name: dto.name, grants: dto.grants },
      });

      return { id };
    });
  }
}

/** Shared by create + update: every grant must name a real catalog key, and a
 *  'branch' scope is only valid on a scopable permission. */
export function validateGrants(
  grants: { permissionKey: string; scope: 'org' | 'branch' }[],
): void {
  for (const g of grants) {
    if (!isPermissionKey(g.permissionKey)) {
      throw new BadRequestException(
        `Unknown permission: ${g.permissionKey}`,
      );
    }
    if (g.scope === 'branch' && !isScopable(g.permissionKey)) {
      throw new BadRequestException(
        `${g.permissionKey} cannot be branch-scoped.`,
      );
    }
  }
  const seen = new Set<string>();
  for (const g of grants) {
    if (seen.has(g.permissionKey)) {
      throw new BadRequestException(
        `Duplicate permission in grants: ${g.permissionKey}`,
      );
    }
    seen.add(g.permissionKey);
  }
}
