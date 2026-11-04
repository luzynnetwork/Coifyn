import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';
import { StylistStatusHistoryRepo } from '../data/stylist-status-history.repo.js';
import type { SetStylistStatusDto } from '../dto/stylist.dto.js';

/**
 * Sets a stylist's live status. Writes an immutable StylistStatusHistory row in
 * the same transaction, then publishes to `stylist-status:<branchId>` for the
 * live board.
 *
 * Rule (phase-1-salon-core.md `stylists`): moving to on_leave/off_shift while
 * the stylist holds future bookings should surface those bookings in the
 * response. The `appointments` module (built later in this backlog) is what
 * would hold that data — until it lands this is a no-op and always returns an
 * empty `affectedBookings` array, not a broken lookup against a table that
 * does not exist yet.
 */
@Injectable()
export class SetStylistStatus {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly statusHistory: StylistStatusHistoryRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string, dto: SetStylistStatusDto) {
    const salonId = await this.salon.execute(user);
    const result = await this.database.withTenant(user.id, salonId, async () => {
      const stylist = await this.stylists.findById(salonId, id);
      if (!stylist) throw new NotFoundException('Stylist not found.');

      await this.authorize.check(user, 'stylist:status', {
        salonId,
        branchId: stylist.branchId,
      });

      const updated = await this.stylists.update(salonId, id, {
        status: dto.status,
      });
      await this.statusHistory.append({
        salonId,
        stylistId: id,
        status: dto.status,
        reason: dto.reason ?? null,
        changedBy: user.id,
      });

      await this.events.emit({
        aggregateType: 'stylist_profile',
        aggregateId: id,
        type: 'StylistStatusChanged',
        salonId,
        payload: { stylistId: id, status: dto.status },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'stylist.status_changed',
        targetType: 'stylist_profile',
        targetId: id,
        reason: dto.reason,
        before: { status: stylist.status },
        after: { status: dto.status },
      });

      return { stylist: updated ?? stylist, branchId: stylist.branchId };
    });

    this.realtime.publish(`stylist-status:${result.branchId}`, {
      stylistId: id,
      status: dto.status,
    });

    // No-op until the appointments module exists — see class doc comment.
    return { ...result.stylist, affectedBookings: [] as unknown[] };
  }
}
