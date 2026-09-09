import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { RolesRepo } from '../data/roles.repo.js';
import type { UpdateRoleDto } from '../dto/role.dto.js';
import { Authorize } from './authorize.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';
import { validateGrants } from './create-role.js';

@Injectable()
export class UpdateRole {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly roles: RolesRepo,
    private readonly audit: AuditWriter,
  ) {}

  async execute(
    user: AuthUser,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<void> {
    const salonId = await this.salon.execute(user);
    if (dto.grants) validateGrants(dto.grants);

    await this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'role:update', { salonId });

      const role = await this.roles.findById(salonId, roleId);
      if (!role) throw new NotFoundException('Role not found.');
      if (role.isStandard) {
        throw new ForbiddenException('Standard roles cannot be edited.');
      }

      if (dto.name && dto.name !== role.name) {
        if (await this.roles.findByName(salonId, dto.name)) {
          throw new ConflictException('A role with that name already exists.');
        }
        await this.roles.rename(salonId, roleId, dto.name);
      }
      if (dto.grants) {
        await this.roles.replaceGrants(salonId, roleId, dto.grants);
      }

      await this.audit.write({
        salonId,
        actor: user,
        action: 'role.updated',
        targetType: 'role',
        targetId: roleId,
        before: { name: role.name, grants: role.grants },
        after: { name: dto.name ?? role.name, grants: dto.grants ?? role.grants },
      });
    });
  }
}
