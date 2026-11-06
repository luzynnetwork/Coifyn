import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module.js';
import { BookingRequestsModule } from '../booking-requests/booking-requests.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { ServicesModule } from '../services/services.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { PublicBookingController } from './public-booking.controller.js';
import { PublicLookupRepo } from './data/public-lookup.repo.js';
import { PublicSalonReader } from './application/public-salon-reader.js';
import { GetPublicSalon } from './application/get-public-salon.js';
import { GetPublicSlots } from './application/get-public-slots.js';
import { SubmitBookingRequest } from './application/submit-booking-request.js';
import { GetPublicQueue } from './application/get-public-queue.js';

/** Phase 2: the public, unauthenticated surface the `customer` app reads —
 *  salon page, open slots, booking requests and the live wait board. */
@Module({
  imports: [
    AvailabilityModule,
    BookingRequestsModule,
    QueueModule,
    RealtimeModule,
    ServicesModule,
    StylistsModule,
    TenancyModule,
  ],
  controllers: [PublicBookingController],
  providers: [
    PublicLookupRepo,
    PublicSalonReader,
    GetPublicSalon,
    GetPublicSlots,
    SubmitBookingRequest,
    GetPublicQueue,
  ],
})
export class PublicBookingModule {}
