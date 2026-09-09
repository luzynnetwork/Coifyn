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
import { ChairsRepo } from '../data/chairs.repo.js';
import type { UpdateChairDto } from '../dto/chair.dto.js';

@Injectable()
export class UpdateChair {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly chairs: ChairsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, chairId: string, dto: UpdateChairDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const chair = await this.chairs.findById(salonId, chairId);
      if (!chair) throw new NotFoundException('Chair not found.');

      await this.authorize.check(user, 'chair:manage', {
        salonId,
        branchId: chair.branchId,
      });

      if (
        dto.label &&
        dto.label !== chair.label &&
        (await this.chairs.findByLabel(salonId, chair.branchId, dto.label))
      ) {
        throw new ConflictException(
          'A chair with that label already exists in this branch.',
        );
      }

      const patch = {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      };
      const updated = await this.chairs.update(salonId, chairId, patch);
      await this.events.emit({
        aggregateType: 'chair',
        aggregateId: chairId,
        type: 'ChairUpdated',
        salonId,
        payload: { changed: Object.keys(patch) },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'chair.updated',
        targetType: 'chair',
        targetId: chairId,
        before: { label: chair.label, isActive: chair.isActive },
        after: patch,
      });
      return updated ?? chair;
    });
  }
}
