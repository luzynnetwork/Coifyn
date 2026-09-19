import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { TicketsRepo, type TicketStatus } from '../data/tickets.repo.js';

@Injectable()
export class ListTickets {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly tickets: TicketsRepo,
  ) {}

  async execute(
    user: AuthUser,
    filter: { branchId?: string; status?: TicketStatus },
  ) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (filter.branchId) {
        if (!(await this.branches.findById(salonId, filter.branchId))) {
          throw new NotFoundException('Branch not found.');
        }
      }
      await this.authorize.check(user, 'pos:operate', {
        salonId,
        branchId: filter.branchId,
      });
      return this.tickets.list(salonId, filter);
    });
  }
}
