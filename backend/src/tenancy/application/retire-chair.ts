import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ChairsRepo } from '../data/chairs.repo.js';

/** Soft-deletes a chair. Kept separate from update-chair because retiring is a
 *  distinct action (it removes the chair from scheduling) and gets its own
 *  event and audit line. */
@Injectable()
export class RetireChair {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly chairs: ChairsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, chairId: string): Promise<void> {
    const salonId = await this.salon.execute(user);
    await this.database.withTenant(user.id, salonId, async () => {
      const chair = await this.chairs.findById(salonId, chairId);
      if (!chair) throw new NotFoundException('Chair not found.');

      await this.authorize.check(user, 'chair:manage', {
        salonId,
        branchId: chair.branchId,
      });

      await this.chairs.softDelete(salonId, chairId);
      await this.events.emit({
        aggregateType: 'chair',
        aggregateId: chairId,
        type: 'ChairRetired',
        salonId,
        payload: { branchId: chair.branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'chair.retired',
        targetType: 'chair',
        targetId: chairId,
        before: { label: chair.label },
      });
    });
  }
}
