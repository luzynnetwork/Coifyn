import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServicesRepo } from '../data/services.repo.js';

@Injectable()
export class GetService {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly services: ServicesRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'service:view', { salonId });
      const service = await this.services.findById(salonId, id);
      if (!service) throw new NotFoundException('Service not found.');
      return service;
    });
  }
}
