import { Injectable } from '@nestjs/common';
import { ServicesRepo } from '../../services/data/services.repo.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { StylistServicesRepo } from '../../stylists/data/stylist-services.repo.js';
import {
  QueueEntriesRepo,
  type QueueEntryRow,
} from '../data/queue-entries.repo.js';
import { computeLaneWait } from '../domain/compute-wait.js';

const DEFAULT_SERVICE_MIN = 30;

const laneOwner = (e: QueueEntryRow) => e.assignedStylistId ?? e.requestedStylistId;

/**
 * The live per-stylist board for a branch: who is in the chair, who is next,
 * how many are waiting and the estimated wait. Scope-agnostic (reads through
 * the ambient scope) so the staff console and the public wait board share it.
 */
@Injectable()
export class QueueBoardBuilder {
  constructor(
    private readonly entries: QueueEntriesRepo,
    private readonly stylists: StylistProfilesRepo,
    private readonly services: ServicesRepo,
    private readonly stylistServices: StylistServicesRepo,
  ) {}

  private async durationFor(
    salonId: string,
    stylistId: string | null,
    serviceIds: string[],
  ): Promise<number> {
    if (serviceIds.length === 0) return DEFAULT_SERVICE_MIN;
    const overrides = stylistId
      ? await this.stylistServices.listForStylist(stylistId)
      : [];
    let total = 0;
    for (const id of serviceIds) {
      const service = await this.services.findById(salonId, id);
      const override = overrides.find((o) => o.serviceId === id);
      total += override?.durationOverrideMin ?? service?.baseDurationMin ?? DEFAULT_SERVICE_MIN;
    }
    return total;
  }

  async build(salonId: string, branchId: string, now = new Date()) {
    const [entries, stylists] = await Promise.all([
      this.entries.listActive(salonId, branchId),
      this.stylists.listForSalon(salonId),
    ]);

    const lanes = [];
    for (const stylist of stylists.filter((s) => s.branchId === branchId)) {
      const mine = entries.filter((e) => laneOwner(e) === stylist.id);
      const inServiceEntry = mine.find((e) => e.status === 'in_service');
      const waiting = mine.filter((e) => e.status !== 'in_service');

      const waitingWithDuration = [];
      for (const e of waiting) {
        waitingWithDuration.push({
          id: e.id,
          durationMin: await this.durationFor(
            salonId,
            stylist.id,
            e.requestedServiceIds as string[],
          ),
        });
      }
      const wait = computeLaneWait({
        inService:
          inServiceEntry?.startedAt
            ? {
                startedAt: inServiceEntry.startedAt,
                durationMin: await this.durationFor(
                  salonId,
                  stylist.id,
                  inServiceEntry.requestedServiceIds as string[],
                ),
              }
            : null,
        waiting: waitingWithDuration,
        now,
      });

      lanes.push({
        stylistId: stylist.id,
        displayName: stylist.displayName,
        status: stylist.status,
        inService: inServiceEntry ?? null,
        nextUp: waiting[0] ?? null,
        waitingCount: waiting.length,
        estimatedMinutes: wait.newJoinerMinutes,
        waiting: waiting.map((e) => ({
          ...e,
          ...wait.entries.find((w) => w.id === e.id)!,
        })),
      });
    }

    return {
      branchId,
      at: now.toISOString(),
      lanes,
      unassigned: entries.filter((e) => !laneOwner(e)),
    };
  }
}
