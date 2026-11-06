import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServicesRepo } from '../data/services.repo.js';

@Injectable()
export class DeleteService {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly services: ServicesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string): Promise<void> {
    const salonId = await this.salon.execute(user);
    await this.database.withTenant(user.id, salonId, async () => {
      const service = await this.services.findById(salonId, id);
      if (!service) throw new NotFoundException('Service not found.');

      await this.authorize.check(user, 'service:manage', { salonId });

      await this.services.softDelete(salonId, id);
      await this.events.emit({
        aggregateType: 'service',
        aggregateId: id,
        type: 'ServiceDeactivated',
        salonId,
        payload: { serviceId: id },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'service.deleted',
        targetType: 'service',
        targetId: id,
        before: { name: service.name },
      });
    });
  }
}
