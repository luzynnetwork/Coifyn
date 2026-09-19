import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServiceCategoriesRepo } from '../data/service-categories.repo.js';
import type { CreateServiceCategoryDto } from '../dto/service-category.dto.js';

@Injectable()
export class CreateServiceCategory {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly categories: ServiceCategoriesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateServiceCategoryDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'service:manage', { salonId });

      const category = await this.categories.create({
        salonId,
        name: dto.name,
        order: dto.order ?? 0,
      }).catch((err) => {
        // unique(salon_id, name) — surface as a clean 409 instead of a raw PG error.
        throw err?.code === '23505'
          ? new ConflictException('A category with that name already exists.')
          : err;
      });

      await this.events.emit({
        aggregateType: 'service_category',
        aggregateId: category.id,
        type: 'ServiceUpdated',
        salonId,
        payload: { changed: ['category_created'], categoryId: category.id },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'service_category.created',
        targetType: 'service_category',
        targetId: category.id,
        after: { name: category.name },
      });

      return category;
    });
  }
}
