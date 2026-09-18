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
import { BranchesRepo } from '../data/branches.repo.js';
import { ChairsRepo } from '../data/chairs.repo.js';
import type { CreateChairDto } from '../dto/chair.dto.js';

@Injectable()
export class CreateChair {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly chairs: ChairsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, branchId: string, dto: CreateChairDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'chair:manage', { salonId, branchId });

      if (await this.chairs.findByLabel(salonId, branchId, dto.label)) {
        throw new ConflictException(
          'A chair with that label already exists in this branch.',
        );
      }

      const chair = await this.chairs.create({
        salonId,
        branchId,
        label: dto.label,
      });
      await this.events.emit({
        aggregateType: 'chair',
        aggregateId: chair.id,
        type: 'ChairCreated',
        salonId,
        payload: { branchId, label: chair.label },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'chair.created',
        targetType: 'chair',
        targetId: chair.id,
        after: { branchId, label: chair.label },
      });
      return chair;
    });
  }
}
