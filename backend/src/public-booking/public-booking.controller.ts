import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetPublicSalon } from './application/get-public-salon.js';
import { GetPublicSlots } from './application/get-public-slots.js';
import { SubmitBookingRequest } from './application/submit-booking-request.js';
import { GetPublicQueue } from './application/get-public-queue.js';
import {
  PublicSlotsQuery,
  SubmitBookingRequestDto,
} from './dto/public-booking.dto.js';

/** Unauthenticated routes for the `customer` app's first slice. They expose
 *  only fields meant for the public (no customer data, no internal ids beyond
 *  what booking needs). */
@ApiTags('public')
@Controller({ path: 'public', version: '1' })
export class PublicBookingController {
  constructor(
    private readonly salonUc: GetPublicSalon,
    private readonly slotsUc: GetPublicSlots,
    private readonly submitUc: SubmitBookingRequest,
    private readonly queueUc: GetPublicQueue,
  ) {}

  @Get('salons/:slug')
  salon(@Param('slug') slug: string) {
    return this.salonUc.execute(slug);
  }

  @Get('salons/:slug/slots')
  slots(@Param('slug') slug: string, @Query() q: PublicSlotsQuery) {
    return this.slotsUc.execute(
      slug,
      q.stylistId,
      q.serviceIds.split(',').filter(Boolean),
      q.date,
    );
  }

  @Post('salons/:slug/booking-requests')
  submit(@Param('slug') slug: string, @Body() dto: SubmitBookingRequestDto) {
    return this.submitUc.execute(slug, dto);
  }

  @Get('branches/:branchId/queue')
  queue(@Param('branchId') branchId: string) {
    return this.queueUc.execute(branchId);
  }
}
