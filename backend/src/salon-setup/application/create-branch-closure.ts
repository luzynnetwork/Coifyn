import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { BranchClosuresRepo } from '../data/branch-closures.repo.js';
import type { CreateBranchClosureDto } from '../dto/branch-closure.dto.js';

@Injectable()
export class CreateBranchClosure {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly closures: BranchClosuresRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(
    user: AuthUser,
    branchId: string,
    dto: CreateBranchClosureDto,
  ) {
    if (dto.endsOn < dto.startsOn) {
      throw new BadRequestException('endsOn cannot be before startsOn.');
    }

    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const branch = await this.branches.findById(salonId, branchId);
      if (!branch) throw new NotFoundException('Branch not found.');

      await this.authorize.check(user, 'branch:update', { salonId, branchId });

      const closure = await this.closures.create({
        salonId,
        branchId,
        startsOn: dto.startsOn,
        endsOn: dto.endsOn,
        reason: dto.reason,
      });

      await this.events.emit({
        aggregateType: 'branch',
        aggregateId: branchId,
        type: 'BranchClosureCreated',
        salonId,
        payload: { branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'branch_closure.created',
        targetType: 'branch_closure',
        targetId: closure.id,
        after: { branchId, startsOn: dto.startsOn, endsOn: dto.endsOn },
      });

      return closure;
    });
  }
}
