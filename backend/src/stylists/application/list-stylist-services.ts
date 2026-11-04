import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';
import { StylistServicesRepo } from '../data/stylist-services.repo.js';

@Injectable()
export class ListStylistServices {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly stylistServices: StylistServicesRepo,
  ) {}

  async execute(user: AuthUser, stylistId: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'stylist:view', { salonId });
      const stylist = await this.stylists.findById(salonId, stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      return this.stylistServices.listForStylist(stylistId);
    });
  }
}
