import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TaxRatesRepo } from '../data/tax-rates.repo.js';
import type { UpdateTaxRateDto } from '../dto/tax-rate.dto.js';

@Injectable()
export class UpdateTaxRate {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly taxRates: TaxRatesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, dto: UpdateTaxRateDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const before = await this.taxRates.findById(salonId, id);
      if (!before) throw new NotFoundException('Tax rate not found.');

      await this.authorize.check(user, 'salon:update', { salonId });

      if (dto.isDefault) {
        await this.taxRates.clearDefault(salonId);
      }

      const patch = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.percentBasisPoints !== undefined && {
          percentBasisPoints: dto.percentBasisPoints,
        }),
        ...(dto.inclusive !== undefined && { inclusive: dto.inclusive }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      };
      const updated = await this.taxRates.update(salonId, id, patch);

      await this.events.emit({
        aggregateType: 'tax_rate',
        aggregateId: id,
        type: 'TaxRateUpdated',
        salonId,
        payload: { changed: Object.keys(patch) },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'tax_rate.updated',
        targetType: 'tax_rate',
        targetId: id,
        before: { name: before.name, percentBasisPoints: before.percentBasisPoints },
        after: patch,
      });

      return updated ?? before;
    });
  }
}
