import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../data/branches.repo.js';
import { ChairsRepo } from '../data/chairs.repo.js';

@Injectable()
export class ListChairs {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly chairs: ChairsRepo,
  ) {}

  async execute(user: AuthUser, branchId: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.authorize.roleNameFor(user, salonId))) {
        throw new ForbiddenException('Not a member of this salon.');
      }
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      return this.chairs.listForBranch(salonId, branchId);
    });
  }
}
