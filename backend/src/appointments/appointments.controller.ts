import {
  Body,
  Controller,
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
  CreateAppointmentDto,
  ListAppointmentsQuery,
  UpdateAppointmentDto,
} from './dto/appointment.dto.js';
import { ListAppointments } from './application/list-appointments.js';
import { GetAppointment } from './application/get-appointment.js';
import { CreateAppointment } from './application/create-appointment.js';
import { UpdateAppointment } from './application/update-appointment.js';
import { ArriveAppointment } from './application/arrive-appointment.js';
import { StartAppointment } from './application/start-appointment.js';
import { CompleteAppointment } from './application/complete-appointment.js';
import { MarkAppointmentNoShow } from './application/mark-appointment-no-show.js';
import { CancelAppointment } from './application/cancel-appointment.js';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class AppointmentsController {
  constructor(
    private readonly listUc: ListAppointments,
    private readonly getUc: GetAppointment,
    private readonly createUc: CreateAppointment,
    private readonly updateUc: UpdateAppointment,
    private readonly arriveUc: ArriveAppointment,
    private readonly startUc: StartAppointment,
    private readonly completeUc: CompleteAppointment,
    private readonly noShowUc: MarkAppointmentNoShow,
    private readonly cancelUc: CancelAppointment,
  ) {}

  @Get('appointments')
  list(@CurrentUser() user: AuthUser, @Query() query: ListAppointmentsQuery) {
    return this.listUc.execute(user, query.branchId, query.date);
  }

  @Post('appointments')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.createUc.execute(user, dto);
  }

  @Get('appointments/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getUc.execute(user, id);
  }

  @Patch('appointments/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.updateUc.execute(user, id, dto);
  }

  @Post('appointments/:id/arrive')
  arrive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.arriveUc.execute(user, id);
  }

  @Post('appointments/:id/start')
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.startUc.execute(user, id);
  }

  @Post('appointments/:id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.completeUc.execute(user, id);
  }

  @Post('appointments/:id/no-show')
  noShow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.noShowUc.execute(user, id);
  }

  @Post('appointments/:id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cancelUc.execute(user, id);
  }
}
