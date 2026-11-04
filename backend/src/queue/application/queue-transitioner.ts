import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import type { EventType } from '../../events/event-registry.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import {
  QueueEntriesRepo,
  type QueueEntryPatch,
  type QueueEntryRow,
  type QueueStatus,
} from '../data/queue-entries.repo.js';

export interface QueueTransition {
  from: QueueStatus[];
  to: QueueStatus;
  eventType: Extract<
    EventType,
    'QueueAssigned' | 'QueueServiceStarted' | 'QueueCompleted' | 'QueueLeft'
  >;
  action: string;
  reason?: string;
  /** Extra validation / fields, run inside the transaction before the update. */
  prepare?: (
    entry: QueueEntryRow,
    salonId: string,
  ) => Promise<QueueEntryPatch>;
}

/**
 * The one place a queue entry changes status: authorize (branch-scoped), check
 * the transition is legal, update, emit the domain event, audit, and publish to
 * `queue:<branchId>` so every open board refetches.
 */
@Injectable()
export class QueueTransitioner {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly entries: QueueEntriesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string, t: QueueTransition) {
    const salonId = await this.salon.execute(user);
    const updated = await this.database.withTenant(
      user.id,
      salonId,
      async () => {
        const entry = await this.entries.findById(salonId, id);
        if (!entry) throw new NotFoundException('Queue entry not found.');

        await this.authorize.check(user, 'queue:manage', {
          salonId,
          branchId: entry.branchId,
        });

        if (!t.from.includes(entry.status as QueueStatus)) {
          throw new ConflictException(
            `Cannot move a "${entry.status}" entry to "${t.to}".`,
          );
        }

        const extra = t.prepare ? await t.prepare(entry, salonId) : {};
        const row = await this.entries.update(salonId, id, {
          status: t.to,
          ...extra,
          ...(t.reason !== undefined && { leftReason: t.reason }),
        });

        await this.events.emit({
          aggregateType: 'queue_entry',
          aggregateId: id,
          type: t.eventType,
          salonId,
          payload: { entryId: id, branchId: entry.branchId },
        });
        await this.audit.write({
          salonId,
          actor: user,
          action: t.action,
          targetType: 'queue_entry',
          targetId: id,
          before: { status: entry.status },
          after: { status: t.to },
          reason: t.reason,
        });
        return row ?? entry;
      },
    );

    this.realtime.publish(`queue:${updated.branchId}`, {
      entryId: id,
      status: updated.status,
    });
    return updated;
  }
}
