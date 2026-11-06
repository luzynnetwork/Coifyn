import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TaxRatesRepo } from '../data/tax-rates.repo.js';

@Injectable()
export class ListTaxRates {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly taxRates: TaxRatesRepo,
  ) {}

  async execute(user: AuthUser) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.authorize.roleNameFor(user, salonId))) {
        throw new ForbiddenException('Not a member of this salon.');
      }
      return this.taxRates.listForSalon(salonId);
    });
  }
}
