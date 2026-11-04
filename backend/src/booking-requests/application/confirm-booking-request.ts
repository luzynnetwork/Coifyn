import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AppointmentBooker } from '../../appointments/application/appointment-booker.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { BookingRequestsRepo } from '../data/booking-requests.repo.js';

/** Staff turns a customer's request into a real appointment (finding or
 *  creating the customer by phone). The booking rules, including the
 *  double-booking check, are the same ones a front-desk booking goes through. */
@Injectable()
export class ConfirmBookingRequest {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly requests: BookingRequestsRepo,
    private readonly customers: CustomersRepo,
    private readonly booker: AppointmentBooker,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
    private readonly realtime: RealtimeBus,
  ) {}

  async execute(user: AuthUser, id: string) {
    const result = await this.scope.run(user, async (salonId) => {
      const request = await this.requests.findById(salonId, id);
      if (!request) throw new NotFoundException('Request not found.');
      await this.authorize.check(user, 'appointment:manage', {
        salonId,
        branchId: request.branchId,
      });
      if (request.status !== 'requested') {
        throw new ConflictException(`Request is already ${request.status}.`);
      }

      const customer =
        (await this.customers.findByPhone(salonId, request.customerPhone)) ??
        (await this.customers.create({
          salonId,
          name: request.customerName,
          phone: request.customerPhone,
        }));

      const appointment = await this.booker.book(
        user,
        salonId,
        {
          branchId: request.branchId,
          stylistId: request.stylistId,
          customerId: customer.id,
          serviceIds: request.serviceIds as string[],
          startAt: request.startAt.toISOString(),
          endAt: request.endAt.toISOString(),
          notes: request.notes ?? undefined,
        },
        { source: 'customer_request' },
      );
      const row = await this.requests.decide(salonId, id, {
        status: 'confirmed',
        decidedBy: user.id,
        appointmentId: appointment.id,
      });
      await this.events.emit({
        aggregateType: 'booking_request',
        aggregateId: id,
        type: 'BookingRequestDecided',
        salonId,
        payload: { requestId: id, status: 'confirmed' },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'booking_request.confirmed',
        targetType: 'booking_request',
        targetId: id,
        after: { appointmentId: appointment.id },
      });
      return { request: row ?? request, appointment };
    });
    this.realtime.publish(`bookings:${result.appointment.stylistId}`, {
      appointmentId: result.appointment.id,
    });
    this.realtime.publish(`front-desk:${result.appointment.branchId}`, {
      appointmentId: result.appointment.id,
    });
    return result;
  }
}
