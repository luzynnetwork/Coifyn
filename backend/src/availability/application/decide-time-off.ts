import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentsRepo } from '../../appointments/data/appointments.repo.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { TimeOffRepo } from '../data/time-off.repo.js';

/** Approve or deny a time-off request. Approving removes the span from
 *  availability at once and returns any bookings already inside it so the
 *  front desk can act (no auto-cancel). */
@Injectable()
export class DecideTimeOff {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly timeOff: TimeOffRepo,
    private readonly appointments: AppointmentsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, id: string, decision: 'approved' | 'denied') {
    return this.scope.run(user, async (salonId) => {
      const request = await this.timeOff.findById(salonId, id);
      if (!request) throw new NotFoundException('Time-off request not found.');
      await this.authorize.check(user, 'roster:manage', {
        salonId,
        branchId: request.branchId,
      });
      if (request.status !== 'requested') {
        throw new ConflictException(`Request is already ${request.status}.`);
      }

      const row = await this.timeOff.decide(salonId, id, decision, user.id);
      await this.events.emit({
        aggregateType: 'stylist_time_off',
        aggregateId: id,
        type: decision === 'approved' ? 'TimeOffApproved' : 'TimeOffDenied',
        salonId,
        payload: { timeOffId: id, stylistId: request.stylistId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: `time_off.${decision}`,
        targetType: 'stylist_time_off',
        targetId: id,
        before: { status: request.status },
        after: { status: decision },
      });

      const affectedAppointments =
        decision === 'approved'
          ? await this.appointments.listActiveForStylist(
              salonId,
              request.stylistId,
              request.fromAt,
              request.toAt,
            )
          : [];
      return { timeOff: row ?? request, affectedAppointments };
    });
  }
}
