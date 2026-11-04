import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  CreateStylistDto,
  SetStylistServicesDto,
  SetStylistStatusDto,
  UpdateStylistDto,
} from './dto/stylist.dto.js';
import { ListStylists } from './application/list-stylists.js';
import { GetStylist } from './application/get-stylist.js';
import { CreateStylist } from './application/create-stylist.js';
import { UpdateStylist } from './application/update-stylist.js';
import { SetStylistStatus } from './application/set-stylist-status.js';
import { ListStylistServices } from './application/list-stylist-services.js';
import { SetStylistServices } from './application/set-stylist-services.js';

@ApiTags('stylists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class StylistsController {
  constructor(
    private readonly listStylistsUc: ListStylists,
    private readonly getStylistUc: GetStylist,
    private readonly createStylistUc: CreateStylist,
    private readonly updateStylistUc: UpdateStylist,
    private readonly setStatusUc: SetStylistStatus,
    private readonly listServicesUc: ListStylistServices,
    private readonly setServicesUc: SetStylistServices,
  ) {}

  @Get('stylists')
  list(@CurrentUser() user: AuthUser) {
    return this.listStylistsUc.execute(user);
  }

  @Get('stylists/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getStylistUc.execute(user, id);
  }

  @Post('stylists')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStylistDto) {
    return this.createStylistUc.execute(user, dto);
  }

  @Patch('stylists/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStylistDto,
  ) {
    return this.updateStylistUc.execute(user, id, dto);
  }

  @Post('stylists/:id/status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetStylistStatusDto,
  ) {
    return this.setStatusUc.execute(user, id, dto);
  }

  @Get('stylists/:id/services')
  services(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listServicesUc.execute(user, id);
  }

  @Put('stylists/:id/services')
  setServices(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetStylistServicesDto,
  ) {
    return this.setServicesUc.execute(user, id, dto);
  }
}
