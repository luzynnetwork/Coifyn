import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { RolesRepo } from '../data/roles.repo.js';
import { Authorize } from './authorize.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';

/**
 * Lists a salon's roles (standard + custom) with their grants. Readable by any
 * member — the role list is not sensitive and the console needs it to render
 * permission state; mutations are gated separately.
 */
@Injectable()
export class ListRoles {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly roles: RolesRepo,
  ) {}

  async execute(user: AuthUser) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const role = await this.authorize.roleNameFor(user, salonId);
      if (!role) return [];
      return this.roles.listForSalon(salonId);
    });
  }
}
