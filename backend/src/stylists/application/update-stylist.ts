import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';
import type { UpdateStylistDto } from '../dto/stylist.dto.js';

@Injectable()
export class UpdateStylist {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, dto: UpdateStylistDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const before = await this.stylists.findById(salonId, id);
      if (!before) throw new NotFoundException('Stylist not found.');

      await this.authorize.check(user, 'stylist:manage', { salonId });

      const patch = {
        ...(dto.branchId !== undefined && { branchId: dto.branchId }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.specialties !== undefined && { specialties: dto.specialties }),
        ...(dto.isBookable !== undefined && { isBookable: dto.isBookable }),
        ...(dto.startedAt !== undefined && {
          startedAt: new Date(dto.startedAt),
        }),
      };
      const updated = await this.stylists.update(salonId, id, patch);

      await this.events.emit({
        aggregateType: 'stylist_profile',
        aggregateId: id,
        type: 'StylistProfileUpdated',
        salonId,
        payload: { changed: Object.keys(patch) },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'stylist.updated',
        targetType: 'stylist_profile',
        targetId: id,
        before: { displayName: before.displayName },
        after: patch,
      });

      return updated ?? before;
    });
  }
}
