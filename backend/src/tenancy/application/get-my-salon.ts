import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { SalonsRepo } from '../data/salons.repo.js';
import { publicSalon } from './create-salon.js';

@Injectable()
export class GetMySalon {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
  ) {}

  async execute(user: AuthUser) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const row = await this.salons.findById(salonId);
      if (!row) throw new NotFoundException('Salon not found.');
      return {
        ...publicSalon(row),
        yourRole: await this.authorize.roleNameFor(user, salonId),
      };
    });
  }
}
