import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServiceAddOnsRepo } from '../data/service-add-ons.repo.js';
import type { CreateServiceAddOnDto } from '../dto/service-add-on.dto.js';

@Injectable()
export class CreateServiceAddOn {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly addOns: ServiceAddOnsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateServiceAddOnDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'service:manage', { salonId });

      const addOn = await this.addOns.create({
        salonId,
        name: dto.name,
        priceMinor: dto.priceMinor,
        durationMin: dto.durationMin,
      });

      await this.events.emit({
        aggregateType: 'service_add_on',
        aggregateId: addOn.id,
        type: 'ServiceUpdated',
        salonId,
        payload: { changed: ['add_on_created'], addOnId: addOn.id },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'service_add_on.created',
        targetType: 'service_add_on',
        targetId: addOn.id,
        after: { name: addOn.name, priceMinor: addOn.priceMinor },
      });

      return addOn;
    });
  }
}
