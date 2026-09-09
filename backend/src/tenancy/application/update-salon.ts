import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { SalonsRepo } from '../data/salons.repo.js';
import type { UpdateSalonDto } from '../dto/salon.dto.js';
import { publicSalon } from './create-salon.js';

@Injectable()
export class UpdateSalon {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly salons: SalonsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: UpdateSalonDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'salon:update', { salonId });

      const before = await this.salons.findById(salonId);
      if (!before) throw new NotFoundException('Salon not found.');

      const patch = {
        ...(dto.brandName !== undefined && { brandName: dto.brandName }),
        ...(dto.legalName !== undefined && { legalName: dto.legalName }),
        ...(dto.currency !== undefined && {
          currency: dto.currency.toUpperCase(),
        }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.taxProfile !== undefined && { taxProfile: dto.taxProfile }),
      };
      const updated = await this.salons.update(salonId, patch);

      await this.events.emit({
        aggregateType: 'salon',
        aggregateId: salonId,
        type: 'SalonUpdated',
        salonId,
        payload: { changed: Object.keys(patch) },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'salon.updated',
        targetType: 'salon',
        targetId: salonId,
        before: publicSalon(before),
        after: updated ? publicSalon(updated) : undefined,
      });

      return publicSalon(updated ?? before);
    });
  }
}
