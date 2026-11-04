import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { StylistPresence } from '../../stylists/application/stylist-presence.js';
import { StylistProfilesRepo } from '../../stylists/data/stylist-profiles.repo.js';
import { DisruptionsRepo } from '../data/disruptions.repo.js';
import type { DeclareDisruptionDto } from '../dto/disruption.dto.js';

const HOUR = 3600 * 1000;

/**
 * Declares that a stylist is running late, absent or leaving early. Opens the
 * affected-customer flow (see NotifyDisruption). An absence also moves the
 * stylist's live status to `on_leave` (or `off_shift` for leaving early).
 * `disruption:manage` or `stylist:status` may declare — a stylist can report
 * their own lateness.
 */
@Injectable()
export class DeclareDisruption {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly stylists: StylistProfilesRepo,
    private readonly disruptions: DisruptionsRepo,
    private readonly presence: StylistPresence,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, dto: DeclareDisruptionDto) {
    if (dto.kind === 'running_late' && !dto.minutesLate) {
      throw new BadRequestException('minutesLate is required for running_late.');
    }
    const windowStart = dto.windowStart ? new Date(dto.windowStart) : new Date();
    const windowEnd = dto.windowEnd
      ? new Date(dto.windowEnd)
      : new Date(windowStart.getTime() + (dto.kind === 'running_late' ? 4 : 12) * HOUR);
    if (!(windowStart < windowEnd)) {
      throw new BadRequestException('windowEnd must be after windowStart.');
    }

    let change = null as Awaited<ReturnType<StylistPresence['set']>>;
    const row = await this.scope.run(user, async (salonId) => {
      const stylist = await this.stylists.findById(salonId, dto.stylistId);
      if (!stylist) throw new NotFoundException('Stylist not found.');
      const ctx = { salonId, branchId: stylist.branchId };
      if (!(await this.authorize.can(user, 'disruption:manage', ctx))) {
        await this.authorize.check(user, 'stylist:status', ctx);
      }

      const disruption = await this.disruptions.create({
        salonId,
        branchId: stylist.branchId,
        stylistId: stylist.id,
        kind: dto.kind,
        minutesLate: dto.minutesLate ?? null,
        windowStart,
        windowEnd,
        createdBy: user.id,
      });

      if (dto.kind === 'absent' || dto.kind === 'left_early') {
        change = await this.presence.set(
          salonId,
          stylist.id,
          dto.kind === 'absent' ? 'on_leave' : 'off_shift',
          user.id,
          `disruption: ${dto.kind}`,
        );
      }

      await this.events.emit({
        aggregateType: 'disruption',
        aggregateId: disruption.id,
        type: 'DisruptionDeclared',
        salonId,
        payload: {
          disruptionId: disruption.id,
          stylistId: stylist.id,
          kind: dto.kind,
        },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'disruption.declared',
        targetType: 'disruption',
        targetId: disruption.id,
        after: { kind: dto.kind, minutesLate: dto.minutesLate },
      });
      return disruption;
    });

    this.presence.announce(change);
    this.realtime.publish(`disruptions:${row.branchId}`, {
      disruptionId: row.id,
      status: row.status,
    });
    return row;
  }
}
