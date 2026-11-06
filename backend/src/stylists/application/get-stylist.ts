import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';

@Injectable()
export class GetStylist {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'stylist:view', { salonId });
      const stylist = await this.stylists.findById(salonId, id);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      return stylist;
    });
  }
}
