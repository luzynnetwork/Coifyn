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
import {
  AssignQueueEntryDto,
  JoinQueueDto,
  RemoveQueueEntryDto,
} from './dto/queue.dto.js';
import { ListQueue } from './application/list-queue.js';
import { JoinQueue } from './application/join-queue.js';
import { AssignQueueEntry } from './application/assign-queue-entry.js';
import { StartQueueEntry } from './application/start-queue-entry.js';
import { CompleteQueueEntry } from './application/complete-queue-entry.js';
import { RemoveQueueEntry } from './application/remove-queue-entry.js';
import { GetWaitEstimate } from './application/get-wait-estimate.js';

@ApiTags('queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class QueueController {
  constructor(
    private readonly listQueueUc: ListQueue,
    private readonly joinQueueUc: JoinQueue,
    private readonly assignUc: AssignQueueEntry,
    private readonly startUc: StartQueueEntry,
    private readonly completeUc: CompleteQueueEntry,
    private readonly removeUc: RemoveQueueEntry,
    private readonly waitEstimateUc: GetWaitEstimate,
  ) {}

  @Get('queue')
  list(@CurrentUser() user: AuthUser, @Query('branchId') branchId: string) {
    return this.listQueueUc.execute(user, branchId);
  }

  @Post('queue')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinQueueDto) {
    return this.joinQueueUc.execute(user, dto);
  }

  @Post('queue/:id/assign')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AssignQueueEntryDto,
  ) {
    return this.assignUc.execute(user, id, dto);
  }

  @Post('queue/:id/start')
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.startUc.execute(user, id);
  }

  @Post('queue/:id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.completeUc.execute(user, id);
  }

  @Post('queue/:id/remove')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RemoveQueueEntryDto,
  ) {
    return this.removeUc.execute(user, id, dto);
  }

  @Get('queue/:id/wait-estimate')
  waitEstimate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.waitEstimateUc.execute(user, id);
  }
}
