import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TaxRatesRepo } from '../../salon-setup/data/tax-rates.repo.js';
import { ServiceAddOnLinksRepo } from '../data/service-add-on-links.repo.js';
import { ServicesRepo } from '../data/services.repo.js';
import type { CreateServiceDto } from '../dto/service.dto.js';

@Injectable()
export class CreateService {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly services: ServicesRepo,
    private readonly taxRates: TaxRatesRepo,
    private readonly addOnLinks: ServiceAddOnLinksRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateServiceDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'service:manage', { salonId });

      if (dto.taxRateId) {
        const rate = await this.taxRates.findById(salonId, dto.taxRateId);
        if (!rate) {
          throw new BadRequestException('taxRateId does not belong to this salon.');
        }
      }

      const service = await this.services.create({
        salonId,
        categoryId: dto.categoryId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        basePriceMinor: dto.basePriceMinor,
        baseDurationMin: dto.baseDurationMin,
        taxRateId: dto.taxRateId ?? null,
        isBookable: dto.isBookable ?? true,
      });

      if (dto.addOnIds) {
        await this.addOnLinks.replaceForService(salonId, service.id, dto.addOnIds);
      }

      await this.events.emit({
        aggregateType: 'service',
        aggregateId: service.id,
        type: 'ServiceCreated',
        salonId,
        payload: { name: service.name },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'service.created',
        targetType: 'service',
        targetId: service.id,
        after: { name: service.name, basePriceMinor: service.basePriceMinor },
      });

      return service;
    });
  }
}
