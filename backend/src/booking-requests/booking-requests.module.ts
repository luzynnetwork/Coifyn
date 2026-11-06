import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { BookingRequestsController } from './booking-requests.controller.js';
import { BookingRequestsRepo } from './data/booking-requests.repo.js';
import { ListBookingRequests } from './application/list-booking-requests.js';
import { ConfirmBookingRequest } from './application/confirm-booking-request.js';
import { DeclineBookingRequest } from './application/decline-booking-request.js';

/** Phase 2: staff side of booking requests submitted from the customer app. */
@Module({
  imports: [AuthModule, RbacModule, RealtimeModule, AppointmentsModule, CustomersModule],
  controllers: [BookingRequestsController],
  providers: [
    BookingRequestsRepo,
    ListBookingRequests,
    ConfirmBookingRequest,
    DeclineBookingRequest,
  ],
  exports: [BookingRequestsRepo],
})
export class BookingRequestsModule {}
