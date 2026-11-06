import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { QueueEntriesRepo } from '../data/queue-entries.repo.js';

/** The customer takes whoever is faster: moves a waiting entry to another
 *  stylist's line (joinedAt is kept, so they do not lose their place). */
@Injectable()
export class SwitchQueueStylist {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly entries: QueueEntriesRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string, stylistId: string) {
    const updated = await this.scope.run(user, async (salonId) => {
      const entry = await this.entries.findById(salonId, id);
      if (!entry) throw new NotFoundException('Queue entry not found.');
      await this.authorize.check(user, 'queue:manage', {
        salonId,
        branchId: entry.branchId,
      });
      if (entry.status !== 'waiting' && entry.status !== 'assigned') {
        throw new ConflictException(`A ${entry.status} entry cannot switch stylist.`);
      }
      const stylist = await this.stylists.findById(salonId, stylistId);
      if (!stylist || stylist.branchId !== entry.branchId) {
        throw new BadRequestException('Stylist must belong to this branch.');
      }

      const row = await this.entries.update(
        salonId,
        id,
        entry.status === 'assigned'
          ? { assignedStylistId: stylistId }
          : { requestedStylistId: stylistId },
      );
      await this.events.emit({
        aggregateType: 'queue_entry',
        aggregateId: id,
        type: 'QueueStylistSwitched',
        salonId,
        payload: { entryId: id, branchId: entry.branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'queue.stylist_switched',
        targetType: 'queue_entry',
        targetId: id,
        before: { stylistId: entry.assignedStylistId ?? entry.requestedStylistId },
        after: { stylistId },
      });
      return row ?? entry;
    });
    this.realtime.publish(`queue:${updated.branchId}`, {
      entryId: id,
      status: updated.status,
    });
    return updated;
  }
}
