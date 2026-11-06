import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  DeclareDisruptionDto,
  ListDisruptionsQuery,
  ResolveOfferDto,
  RunningLateDto,
} from './dto/disruption.dto.js';
import { DeclareDisruption } from './application/declare-disruption.js';
import { DeclareRunningLate } from './application/declare-running-late.js';
import { ListAffected } from './application/list-affected.js';
import { NotifyDisruption } from './application/notify-disruption.js';
import { ListDisruptions } from './application/list-disruptions.js';
import { ResolveOffer } from './application/resolve-offer.js';

@ApiTags('disruptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class DisruptionsController {
  constructor(
    private readonly declareUc: DeclareDisruption,
    private readonly lateUc: DeclareRunningLate,
    private readonly affectedUc: ListAffected,
    private readonly notifyUc: NotifyDisruption,
    private readonly listUc: ListDisruptions,
    private readonly resolveUc: ResolveOffer,
  ) {}

  @Get('disruptions')
  list(@CurrentUser() user: AuthUser, @Query() q: ListDisruptionsQuery) {
    return this.listUc.execute(user, q.branchId, q.status);
  }

  @Post('disruptions')
  declare(@CurrentUser() user: AuthUser, @Body() dto: DeclareDisruptionDto) {
    return this.declareUc.execute(user, dto);
  }

  @Get('disruptions/:id/affected')
  affected(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.affectedUc.execute(user, id);
  }

  @Post('disruptions/:id/notify')
  notify(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifyUc.execute(user, id);
  }

  @Post('disruption-offers/:id/resolve')
  resolve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ResolveOfferDto,
  ) {
    return this.resolveUc.execute(user, id, dto);
  }

  @Post('stylists/:id/running-late')
  runningLate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RunningLateDto,
  ) {
    return this.lateUc.execute(user, id, dto.minutes);
  }
}
