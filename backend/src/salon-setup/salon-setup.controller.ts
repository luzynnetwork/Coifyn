import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SetBranchHoursDto } from './dto/branch-hours.dto.js';
import { CreateBranchClosureDto } from './dto/branch-closure.dto.js';
import { CreateTaxRateDto, UpdateTaxRateDto } from './dto/tax-rate.dto.js';
import { SetBranchHours } from './application/set-branch-hours.js';
import { GetBranchHours } from './application/get-branch-hours.js';
import { ListBranchClosures } from './application/list-branch-closures.js';
import { CreateBranchClosure } from './application/create-branch-closure.js';
import { DeleteBranchClosure } from './application/delete-branch-closure.js';
import { ListTaxRates } from './application/list-tax-rates.js';
import { CreateTaxRate } from './application/create-tax-rate.js';
import { UpdateTaxRate } from './application/update-tax-rate.js';

@ApiTags('salon-setup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class SalonSetupController {
  constructor(
    private readonly getBranchHoursUc: GetBranchHours,
    private readonly setBranchHoursUc: SetBranchHours,
    private readonly listBranchClosuresUc: ListBranchClosures,
    private readonly createBranchClosureUc: CreateBranchClosure,
    private readonly deleteBranchClosureUc: DeleteBranchClosure,
    private readonly listTaxRatesUc: ListTaxRates,
    private readonly createTaxRateUc: CreateTaxRate,
    private readonly updateTaxRateUc: UpdateTaxRate,
  ) {}

  // ── Branch hours ──────────────────────────────────────────────────────────
  @Get('branches/:id/hours')
  getHours(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.getBranchHoursUc.execute(user, id);
  }

  @Put('branches/:id/hours')
  setHours(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetBranchHoursDto,
  ) {
    return this.setBranchHoursUc.execute(user, id, dto);
  }

  // ── Branch closures ───────────────────────────────────────────────────────
  @Get('branches/:id/closures')
  closures(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listBranchClosuresUc.execute(user, id);
  }

  @Post('branches/:id/closures')
  createClosure(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateBranchClosureDto,
  ) {
    return this.createBranchClosureUc.execute(user, id, dto);
  }

  @Delete('branch-closures/:id')
  @HttpCode(204)
  async deleteClosure(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteBranchClosureUc.execute(user, id);
  }

  // ── Tax rates ─────────────────────────────────────────────────────────────
  @Get('tax-rates')
  taxRates(@CurrentUser() user: AuthUser) {
    return this.listTaxRatesUc.execute(user);
  }

  @Post('tax-rates')
  createTaxRate(@CurrentUser() user: AuthUser, @Body() dto: CreateTaxRateDto) {
    return this.createTaxRateUc.execute(user, dto);
  }

  @Patch('tax-rates/:id')
  updateTaxRate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaxRateDto,
  ) {
    return this.updateTaxRateUc.execute(user, id, dto);
  }
}
