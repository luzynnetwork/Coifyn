import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';
import type { CreateStylistDto } from '../dto/stylist.dto.js';

@Injectable()
export class CreateStylist {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateStylistDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'stylist:manage', { salonId });

      const existing = await this.stylists.findByUserId(salonId, dto.userId);
      if (existing) {
        throw new ConflictException('That user already has a stylist profile.');
      }

      const stylist = await this.stylists.create({
        salonId,
        userId: dto.userId,
        branchId: dto.branchId,
        displayName: dto.displayName,
        bio: dto.bio ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        specialties: dto.specialties ?? [],
        isBookable: dto.isBookable ?? true,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
      });

      await this.events.emit({
        aggregateType: 'stylist_profile',
        aggregateId: stylist.id,
        type: 'StylistProfileCreated',
        salonId,
        payload: { userId: stylist.userId, branchId: stylist.branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'stylist.created',
        targetType: 'stylist_profile',
        targetId: stylist.id,
        after: { userId: stylist.userId, branchId: stylist.branchId },
      });

      return stylist;
    });
  }
}
