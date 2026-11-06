import { Injectable } from '@nestjs/common';
import { EventBus } from '../../events/event-bus.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistProfilesRepo } from '../data/stylist-profiles.repo.js';
import { StylistStatusHistoryRepo } from '../data/stylist-status-history.repo.js';

export interface PresenceChange {
  stylistId: string;
  branchId: string;
  status: string;
  changed: boolean;
}

/**
 * Moves a stylist's live status as a side effect of something else (clock-in,
 * a service starting, a disruption) — status history + `StylistStatusChanged`
 * in the caller's transaction. The user-driven path with its own authorization
 * and audit entry stays in SetStylistStatus. Call {@link announce} after the
 * transaction commits so boards refetch committed state.
 */
@Injectable()
export class StylistPresence {
  constructor(
    private readonly stylists: StylistProfilesRepo,
    private readonly history: StylistStatusHistoryRepo,
    private readonly events: EventBus,
    private readonly realtime: RealtimeBus,
  ) {}

  async set(
    salonId: string,
    stylistId: string,
    status: string,
    changedBy: string,
    reason?: string,
  ): Promise<PresenceChange | null> {
    const stylist = await this.stylists.findById(salonId, stylistId);
    if (!stylist) return null;
    if (stylist.status === status) {
      return { stylistId, branchId: stylist.branchId, status, changed: false };
    }
    await this.stylists.update(salonId, stylistId, { status });
    await this.history.append({
      salonId,
      stylistId,
      status,
      reason: reason ?? null,
      changedBy,
    });
    await this.events.emit({
      aggregateType: 'stylist_profile',
      aggregateId: stylistId,
      type: 'StylistStatusChanged',
      salonId,
      payload: { stylistId, status },
    });
    return { stylistId, branchId: stylist.branchId, status, changed: true };
  }

  announce(change: PresenceChange | null): void {
    if (!change?.changed) return;
    this.realtime.publish(`stylist-status:${change.branchId}`, {
      stylistId: change.stylistId,
      status: change.status,
    });
  }
}
