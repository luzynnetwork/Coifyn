import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';
import { StylistServicesRepo } from '../data/stylist-services.repo.js';
import type { SetStylistServicesDto } from '../dto/stylist.dto.js';

@Injectable()
export class SetStylistServices {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly stylistServices: StylistServicesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, stylistId: string, dto: SetStylistServicesDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const stylist = await this.stylists.findById(salonId, stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');

      await this.authorize.check(user, 'stylist:manage', { salonId });

      const rows = await this.stylistServices.replaceForStylist(
        salonId,
        stylistId,
        dto.entries.map((e) => ({
          serviceId: e.serviceId,
          priceOverrideMinor: e.priceOverrideMinor ?? null,
          durationOverrideMin: e.durationOverrideMin ?? null,
          canPerform: e.canPerform ?? true,
        })),
      );

      await this.events.emit({
        aggregateType: 'stylist_profile',
        aggregateId: stylistId,
        type: 'StylistServiceUpdated',
        salonId,
        payload: { stylistId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'stylist.services_updated',
        targetType: 'stylist_profile',
        targetId: stylistId,
        after: { count: rows.length },
      });

      return rows;
    });
  }
}
