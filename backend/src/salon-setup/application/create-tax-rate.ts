import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TaxRatesRepo } from '../data/tax-rates.repo.js';
import type { CreateTaxRateDto } from '../dto/tax-rate.dto.js';

@Injectable()
export class CreateTaxRate {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly taxRates: TaxRatesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateTaxRateDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'salon:update', { salonId });

      // Exactly one default at a time — clear before insert if this one claims it.
      if (dto.isDefault) {
        await this.taxRates.clearDefault(salonId);
      }

      const rate = await this.taxRates.create({
        salonId,
        name: dto.name,
        percentBasisPoints: dto.percentBasisPoints,
        inclusive: dto.inclusive,
        isDefault: dto.isDefault ?? false,
      });

      await this.events.emit({
        aggregateType: 'tax_rate',
        aggregateId: rate.id,
        type: 'TaxRateCreated',
        salonId,
        payload: { name: rate.name },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'tax_rate.created',
        targetType: 'tax_rate',
        targetId: rate.id,
        after: {
          name: rate.name,
          percentBasisPoints: rate.percentBasisPoints,
        },
      });

      return rate;
    });
  }
}
