import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ListBookingRequestsQuery } from './dto/booking-request.dto.js';
import { ListBookingRequests } from './application/list-booking-requests.js';
import { ConfirmBookingRequest } from './application/confirm-booking-request.js';
import { DeclineBookingRequest } from './application/decline-booking-request.js';

@ApiTags('booking-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'booking-requests', version: '1' })
export class BookingRequestsController {
  constructor(
    private readonly listUc: ListBookingRequests,
    private readonly confirmUc: ConfirmBookingRequest,
    private readonly declineUc: DeclineBookingRequest,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ListBookingRequestsQuery) {
    return this.listUc.execute(user, q.branchId, q.status);
  }

  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.confirmUc.execute(user, id);
  }

  @Post(':id/decline')
  decline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.declineUc.execute(user, id);
  }
}
