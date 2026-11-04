import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RefundPaymentDto, TakePaymentDto } from './dto/payment.dto.js';
import { TakePayment } from './application/take-payment.js';
import { RefundPayment } from './application/refund-payment.js';
import { ListPayments } from './application/list-payments.js';
import { GetPayment } from './application/get-payment.js';
import { GetTicketReceipt } from './application/get-ticket-receipt.js';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class PaymentsController {
  constructor(
    private readonly takeUc: TakePayment,
    private readonly refundUc: RefundPayment,
    private readonly listUc: ListPayments,
    private readonly getUc: GetPayment,
    private readonly receiptUc: GetTicketReceipt,
  ) {}

  /** A declined card returns 201 with `settled: false` and payment.status
   *  "failed" — the attempt is recorded, the ticket stays open. */
  @Post('payments')
  take(@CurrentUser() user: AuthUser, @Body() dto: TakePaymentDto) {
    return this.takeUc.execute(user, dto);
  }

  @Get('payments')
  list(
    @CurrentUser() user: AuthUser,
    @Query('ticketId') ticketId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.listUc.execute(user, { ticketId, branchId });
  }

  @Get('payments/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getUc.execute(user, id);
  }

  @Post('payments/:id/refund')
  refund(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.refundUc.execute(user, id, dto);
  }

  @Get('tickets/:id/receipt')
  receipt(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.receiptUc.execute(user, id);
  }
}
