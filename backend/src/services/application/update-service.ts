import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { TaxRatesRepo } from '../../salon-setup/data/tax-rates.repo.js';
import { ServiceAddOnLinksRepo } from '../data/service-add-on-links.repo.js';
import { ServicesRepo } from '../data/services.repo.js';
import type { UpdateServiceDto } from '../dto/service.dto.js';

@Injectable()
export class UpdateService {
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

  async execute(user: AuthUser, id: string, dto: UpdateServiceDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const before = await this.services.findById(salonId, id);
      if (!before) throw new NotFoundException('Service not found.');

      await this.authorize.check(user, 'service:manage', { salonId });

      if (dto.taxRateId) {
        const rate = await this.taxRates.findById(salonId, dto.taxRateId);
        if (!rate) {
          throw new BadRequestException('taxRateId does not belong to this salon.');
        }
      }

      const patch = {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.basePriceMinor !== undefined && {
          basePriceMinor: dto.basePriceMinor,
        }),
        ...(dto.baseDurationMin !== undefined && {
          baseDurationMin: dto.baseDurationMin,
        }),
        ...(dto.taxRateId !== undefined && { taxRateId: dto.taxRateId }),
        ...(dto.isBookable !== undefined && { isBookable: dto.isBookable }),
      };
      const updated = await this.services.update(salonId, id, patch);

      if (dto.addOnIds) {
        await this.addOnLinks.replaceForService(salonId, id, dto.addOnIds);
      }

      await this.events.emit({
        aggregateType: 'service',
        aggregateId: id,
        type: 'ServiceUpdated',
        salonId,
        payload: { changed: Object.keys(patch) },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'service.updated',
        targetType: 'service',
        targetId: id,
        before: { name: before.name, basePriceMinor: before.basePriceMinor },
        after: patch,
      });

      return updated ?? before;
    });
  }
}
