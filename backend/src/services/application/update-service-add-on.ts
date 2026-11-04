import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServiceAddOnsRepo } from '../data/service-add-ons.repo.js';
import type { UpdateServiceAddOnDto } from '../dto/service-add-on.dto.js';

@Injectable()
export class UpdateServiceAddOn {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly addOns: ServiceAddOnsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, dto: UpdateServiceAddOnDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const before = await this.addOns.findById(salonId, id);
      if (!before) throw new NotFoundException('Service add-on not found.');

      await this.authorize.check(user, 'service:manage', { salonId });

      const patch = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.priceMinor !== undefined && { priceMinor: dto.priceMinor }),
        ...(dto.durationMin !== undefined && { durationMin: dto.durationMin }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      };
      const updated = await this.addOns.update(salonId, id, patch);

      await this.events.emit({
        aggregateType: 'service_add_on',
        aggregateId: id,
        type: 'ServiceUpdated',
        salonId,
        payload: { changed: Object.keys(patch), addOnId: id },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'service_add_on.updated',
        targetType: 'service_add_on',
        targetId: id,
        before: { name: before.name, priceMinor: before.priceMinor },
        after: patch,
      });

      return updated ?? before;
    });
  }
}
