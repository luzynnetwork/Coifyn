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
import {
  ApplyShiftTemplateDto,
  CreateShiftDto,
  CreateShiftTemplateDto,
  ListTimeOffQuery,
  RequestTimeOffDto,
  RosterQuery,
  SlotsQuery,
  UpdateShiftDto,
} from './dto/availability.dto.js';
import { ListRoster } from './application/list-roster.js';
import { CreateShift } from './application/create-shift.js';
import { UpdateShift } from './application/update-shift.js';
import { DeleteShift } from './application/delete-shift.js';
import { CreateShiftTemplate } from './application/create-shift-template.js';
import { ListShiftTemplates } from './application/list-shift-templates.js';
import { ApplyShiftTemplate } from './application/apply-shift-template.js';
import { ListTimeOff } from './application/list-time-off.js';
import { RequestTimeOff } from './application/request-time-off.js';
import { DecideTimeOff } from './application/decide-time-off.js';
import { GetSlots } from './application/get-slots.js';

@ApiTags('availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class AvailabilityController {
  constructor(
    private readonly rosterUc: ListRoster,
    private readonly createShiftUc: CreateShift,
    private readonly updateShiftUc: UpdateShift,
    private readonly deleteShiftUc: DeleteShift,
    private readonly createTemplateUc: CreateShiftTemplate,
    private readonly listTemplatesUc: ListShiftTemplates,
    private readonly applyTemplateUc: ApplyShiftTemplate,
    private readonly listTimeOffUc: ListTimeOff,
    private readonly requestTimeOffUc: RequestTimeOff,
    private readonly decideTimeOffUc: DecideTimeOff,
    private readonly slotsUc: GetSlots,
  ) {}

  @Get('availability/roster')
  roster(@CurrentUser() user: AuthUser, @Query() q: RosterQuery) {
    return this.rosterUc.execute(user, q.branchId, q.from, q.to);
  }

  @Get('availability/slots')
  slots(@CurrentUser() user: AuthUser, @Query() q: SlotsQuery) {
    return this.slotsUc.execute(
      user,
      q.stylistId,
      q.serviceIds.split(',').filter(Boolean),
      q.date,
    );
  }

  @Post('shifts')
  createShift(@CurrentUser() user: AuthUser, @Body() dto: CreateShiftDto) {
    return this.createShiftUc.execute(user, dto);
  }

  @Patch('shifts/:id')
  updateShift(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.updateShiftUc.execute(user, id, dto);
  }

  @Delete('shifts/:id')
  deleteShift(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.deleteShiftUc.execute(user, id);
  }

  @Get('shift-templates')
  templates(@CurrentUser() user: AuthUser) {
    return this.listTemplatesUc.execute(user);
  }

  @Post('shift-templates')
  createTemplate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateShiftTemplateDto,
  ) {
    return this.createTemplateUc.execute(user, dto);
  }

  @Post('shift-templates/:id/apply')
  applyTemplate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApplyShiftTemplateDto,
  ) {
    return this.applyTemplateUc.execute(user, id, dto);
  }

  @Get('time-off')
  timeOff(@CurrentUser() user: AuthUser, @Query() q: ListTimeOffQuery) {
    return this.listTimeOffUc.execute(user, q.branchId, q.status);
  }

  @Post('time-off')
  requestTimeOff(@CurrentUser() user: AuthUser, @Body() dto: RequestTimeOffDto) {
    return this.requestTimeOffUc.execute(user, dto);
  }

  @Post('time-off/:id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.decideTimeOffUc.execute(user, id, 'approved');
  }

  @Post('time-off/:id/deny')
  deny(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.decideTimeOffUc.execute(user, id, 'denied');
  }
}
