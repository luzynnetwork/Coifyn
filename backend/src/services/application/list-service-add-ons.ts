import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServiceAddOnsRepo } from '../data/service-add-ons.repo.js';

@Injectable()
export class ListServiceAddOns {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly addOns: ServiceAddOnsRepo,
  ) {}

  async execute(user: AuthUser) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'service:view', { salonId });
      return this.addOns.listForSalon(salonId);
    });
  }
}
