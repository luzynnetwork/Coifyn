import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { TicketStatus } from './data/tickets.repo.js';
import {
  CloseRegisterSessionDto,
  CurrentRegisterSessionQuery,
  OpenRegisterSessionDto,
} from './dto/register-session.dto.js';
import {
  AddTicketLineDto,
  ApplyDiscountDto,
  CreateTicketDto,
  UpdateTicketLineDto,
  VoidTicketDto,
} from './dto/ticket.dto.js';
import { OpenRegisterSession } from './application/open-register-session.js';
import { CloseRegisterSession } from './application/close-register-session.js';
import { GetCurrentRegisterSession } from './application/get-current-register-session.js';
import { CreateTicket } from './application/create-ticket.js';
import { ListTickets } from './application/list-tickets.js';
import { GetTicket } from './application/get-ticket.js';
import { AddTicketLine } from './application/add-ticket-line.js';
import { UpdateTicketLine } from './application/update-ticket-line.js';
import { RemoveTicketLine } from './application/remove-ticket-line.js';
import { ApplyTicketDiscount } from './application/apply-ticket-discount.js';
import { VoidTicket } from './application/void-ticket.js';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class TicketsController {
  constructor(
    private readonly openSessionUc: OpenRegisterSession,
    private readonly closeSessionUc: CloseRegisterSession,
    private readonly currentSessionUc: GetCurrentRegisterSession,
    private readonly createTicketUc: CreateTicket,
    private readonly listTicketsUc: ListTickets,
    private readonly getTicketUc: GetTicket,
    private readonly addLineUc: AddTicketLine,
    private readonly updateLineUc: UpdateTicketLine,
    private readonly removeLineUc: RemoveTicketLine,
    private readonly discountUc: ApplyTicketDiscount,
    private readonly voidUc: VoidTicket,
  ) {}

  // ── Register sessions ─────────────────────────────────────────────────────
  @Post('register-sessions')
  openSession(@CurrentUser() user: AuthUser, @Body() dto: OpenRegisterSessionDto) {
    return this.openSessionUc.execute(user, dto);
  }

  @Get('register-sessions/current')
  currentSession(
    @CurrentUser() user: AuthUser,
    @Query() query: CurrentRegisterSessionQuery,
  ) {
    return this.currentSessionUc.execute(user, query.branchId);
  }

  @Post('register-sessions/:id/close')
  closeSession(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CloseRegisterSessionDto,
  ) {
    return this.closeSessionUc.execute(user, id, dto);
  }

  // ── Tickets ───────────────────────────────────────────────────────────────
  @Post('tickets')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.createTicketUc.execute(user, dto);
  }

  @Get('tickets')
  list(
    @CurrentUser() user: AuthUser,
    @Query('branchId') branchId?: string,
    @Query('status') status?: TicketStatus,
  ) {
    return this.listTicketsUc.execute(user, { branchId, status });
  }

  @Get('tickets/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getTicketUc.execute(user, id);
  }

  @Post('tickets/:id/lines')
  addLine(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddTicketLineDto,
  ) {
    return this.addLineUc.execute(user, id, dto);
  }

  @Patch('tickets/:id/lines/:lineId')
  updateLine(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateTicketLineDto,
  ) {
    return this.updateLineUc.execute(user, id, lineId, dto);
  }

  @Delete('tickets/:id/lines/:lineId')
  removeLine(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
  ) {
    return this.removeLineUc.execute(user, id, lineId);
  }

  @Post('tickets/:id/discount')
  discount(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApplyDiscountDto,
  ) {
    return this.discountUc.execute(user, id, dto);
  }

  @Post('tickets/:id/void')
  void(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: VoidTicketDto,
  ) {
    return this.voidUc.execute(user, id, dto);
  }
}
