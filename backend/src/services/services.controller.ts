import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from './dto/service-category.dto.js';
import {
  CreateServiceAddOnDto,
  UpdateServiceAddOnDto,
} from './dto/service-add-on.dto.js';
import {
  CreateServiceDto,
  SetServiceActiveDto,
  UpdateServiceDto,
} from './dto/service.dto.js';
import { ListServices } from './application/list-services.js';
import { GetService } from './application/get-service.js';
import { CreateService } from './application/create-service.js';
import { UpdateService } from './application/update-service.js';
import { DeleteService } from './application/delete-service.js';
import { SetServiceActive } from './application/set-service-active.js';
import { ListServiceCategories } from './application/list-service-categories.js';
import { CreateServiceCategory } from './application/create-service-category.js';
import { UpdateServiceCategory } from './application/update-service-category.js';
import { ListServiceAddOns } from './application/list-service-add-ons.js';
import { CreateServiceAddOn } from './application/create-service-add-on.js';
import { UpdateServiceAddOn } from './application/update-service-add-on.js';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ServicesController {
  constructor(
    private readonly listServicesUc: ListServices,
    private readonly getServiceUc: GetService,
    private readonly createServiceUc: CreateService,
    private readonly updateServiceUc: UpdateService,
    private readonly deleteServiceUc: DeleteService,
    private readonly setServiceActiveUc: SetServiceActive,
    private readonly listCategoriesUc: ListServiceCategories,
    private readonly createCategoryUc: CreateServiceCategory,
    private readonly updateCategoryUc: UpdateServiceCategory,
    private readonly listAddOnsUc: ListServiceAddOns,
    private readonly createAddOnUc: CreateServiceAddOn,
    private readonly updateAddOnUc: UpdateServiceAddOn,
  ) {}

  // ── Services ──────────────────────────────────────────────────────────────
  @Get('services')
  list(@CurrentUser() user: AuthUser) {
    return this.listServicesUc.execute(user);
  }

  @Get('services/:id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getServiceUc.execute(user, id);
  }

  @Post('services')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.createServiceUc.execute(user, dto);
  }

  @Patch('services/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.updateServiceUc.execute(user, id, dto);
  }

  @Delete('services/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteServiceUc.execute(user, id);
  }

  @Post('services/:id/active')
  setActive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetServiceActiveDto,
  ) {
    return this.setServiceActiveUc.execute(user, id, dto);
  }

  // ── Service categories ───────────────────────────────────────────────────
  @Get('service-categories')
  categories(@CurrentUser() user: AuthUser) {
    return this.listCategoriesUc.execute(user);
  }

  @Post('service-categories')
  createCategory(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateServiceCategoryDto,
  ) {
    return this.createCategoryUc.execute(user, dto);
  }

  @Patch('service-categories/:id')
  updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.updateCategoryUc.execute(user, id, dto);
  }

  // ── Service add-ons ──────────────────────────────────────────────────────
  @Get('service-add-ons')
  addOns(@CurrentUser() user: AuthUser) {
    return this.listAddOnsUc.execute(user);
  }

  @Post('service-add-ons')
  createAddOn(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateServiceAddOnDto,
  ) {
    return this.createAddOnUc.execute(user, dto);
  }

  @Patch('service-add-ons/:id')
  updateAddOn(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceAddOnDto,
  ) {
    return this.updateAddOnUc.execute(user, id, dto);
  }
}
