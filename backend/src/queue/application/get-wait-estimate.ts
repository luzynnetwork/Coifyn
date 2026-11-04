import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { QueueEntriesRepo } from '../data/queue-entries.repo.js';

/**
 * Phase 1 simplification: a flat average service length per person ahead.
 * Real per-stylist estimates (sum of remaining durations) are Phase 2's queue
 * extension.
 */
export const AVERAGE_SERVICE_MINUTES = 30;

@Injectable()
export class GetWaitEstimate {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly entries: QueueEntriesRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const entry = await this.entries.findById(salonId, id);
      if (!entry) throw new NotFoundException('Queue entry not found.');
      await this.authorize.check(user, 'queue:view', {
        salonId,
        branchId: entry.branchId,
      });

      const ahead =
        entry.status === 'waiting'
          ? await this.entries.countWaitingAhead(
              salonId,
              entry.branchId,
              entry.joinedAt,
            )
          : 0;
      return { ahead, minutes: ahead * AVERAGE_SERVICE_MINUTES };
    });
  }
}
