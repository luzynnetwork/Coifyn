import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ServiceCategoriesRepo } from '../data/service-categories.repo.js';
import type { UpdateServiceCategoryDto } from '../dto/service-category.dto.js';

@Injectable()
export class UpdateServiceCategory {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly categories: ServiceCategoriesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string, dto: UpdateServiceCategoryDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const before = await this.categories.findById(salonId, id);
      if (!before) throw new NotFoundException('Service category not found.');

      await this.authorize.check(user, 'service:manage', { salonId });

      const patch = {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.order !== undefined && { order: dto.order }),
      };
      const updated = await this.categories
        .update(salonId, id, patch)
        .catch((err) => {
          throw err?.code === '23505'
            ? new ConflictException('A category with that name already exists.')
            : err;
        });

      await this.events.emit({
        aggregateType: 'service_category',
        aggregateId: id,
        type: 'ServiceUpdated',
        salonId,
        payload: { changed: Object.keys(patch), categoryId: id },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'service_category.updated',
        targetType: 'service_category',
        targetId: id,
        before: { name: before.name, order: before.order },
        after: patch,
      });

      return updated ?? before;
    });
  }
}
