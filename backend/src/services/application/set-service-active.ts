import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServicesRepo } from '../data/services.repo.js';
import type { SetServiceActiveDto } from '../dto/service.dto.js';

/** Activates or deactivates a service without deleting it — the
 *  `POST /services/:id/active` toggle distinct from the hard-delete route. */
@Injectable()
export class SetServiceActive {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly services: ServicesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, dto: SetServiceActiveDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const service = await this.services.findById(salonId, id);
      if (!service) throw new NotFoundException('Service not found.');

      await this.authorize.check(user, 'service:manage', { salonId });

      const updated = await this.services.update(salonId, id, {
        isActive: dto.isActive,
      });

      if (!dto.isActive) {
        await this.events.emit({
          aggregateType: 'service',
          aggregateId: id,
          type: 'ServiceDeactivated',
          salonId,
          payload: { serviceId: id },
        });
      } else {
        await this.events.emit({
          aggregateType: 'service',
          aggregateId: id,
          type: 'ServiceUpdated',
          salonId,
          payload: { changed: ['isActive'] },
        });
      }
      await this.audit.write({
        salonId,
        actor: user,
        action: dto.isActive ? 'service.activated' : 'service.deactivated',
        targetType: 'service',
        targetId: id,
        before: { isActive: service.isActive },
        after: { isActive: dto.isActive },
      });

      return updated ?? service;
    });
  }
}
