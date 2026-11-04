import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { BookingRequestsRepo } from '../data/booking-requests.repo.js';

@Injectable()
export class DeclineBookingRequest {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly requests: BookingRequestsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  execute(user: AuthUser, id: string) {
    return this.scope.run(user, async (salonId) => {
      const request = await this.requests.findById(salonId, id);
      if (!request) throw new NotFoundException('Request not found.');
      await this.authorize.check(user, 'appointment:manage', {
        salonId,
        branchId: request.branchId,
      });
      if (request.status !== 'requested') {
        throw new ConflictException(`Request is already ${request.status}.`);
      }
      const row = await this.requests.decide(salonId, id, {
        status: 'declined',
        decidedBy: user.id,
      });
      await this.events.emit({
        aggregateType: 'booking_request',
        aggregateId: id,
        type: 'BookingRequestDecided',
        salonId,
        payload: { requestId: id, status: 'declined' },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'booking_request.declined',
        targetType: 'booking_request',
        targetId: id,
      });
      return row ?? request;
    });
  }
}
