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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { CreateSalonDto } from './dto/onboarding.dto.js';
import { UpdateSalonDto } from './dto/salon.dto.js';
import {
  CreateBranchDto,
  SetBranchHoursDto,
  UpdateBranchDto,
} from './dto/branch.dto.js';
import { CreateChairDto, UpdateChairDto } from './dto/chair.dto.js';
import { CreateSalon } from './application/create-salon.js';
import { GetMySalon } from './application/get-my-salon.js';
import { UpdateSalon } from './application/update-salon.js';
import { ListBranches } from './application/list-branches.js';
import { CreateBranch } from './application/create-branch.js';
import { UpdateBranch } from './application/update-branch.js';
import { DeleteBranch } from './application/delete-branch.js';
import { ListChairs } from './application/list-chairs.js';
import { CreateChair } from './application/create-chair.js';
import { UpdateChair } from './application/update-chair.js';
import { RetireChair } from './application/retire-chair.js';

@ApiTags('tenancy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class TenancyController {
  constructor(
    private readonly createSalonUc: CreateSalon,
    private readonly getMySalon: GetMySalon,
    private readonly updateSalonUc: UpdateSalon,
    private readonly listBranches: ListBranches,
    private readonly createBranchUc: CreateBranch,
    private readonly updateBranchUc: UpdateBranch,
    private readonly deleteBranchUc: DeleteBranch,
    private readonly listChairs: ListChairs,
    private readonly createChairUc: CreateChair,
    private readonly updateChairUc: UpdateChair,
    private readonly retireChairUc: RetireChair,
  ) {}

  // ── Onboarding & salon ────────────────────────────────────────────────────
  @Post('onboarding/salon')
  onboard(@CurrentUser() user: AuthUser, @Body() dto: CreateSalonDto) {
    return this.createSalonUc.execute(user, dto);
  }

  @Get('salon')
  salon(@CurrentUser() user: AuthUser) {
    return this.getMySalon.execute(user);
  }

  @Patch('salon')
  patchSalon(@CurrentUser() user: AuthUser, @Body() dto: UpdateSalonDto) {
    return this.updateSalonUc.execute(user, dto);
  }

  // ── Branches ──────────────────────────────────────────────────────────────
  @Get('branches')
  branches(@CurrentUser() user: AuthUser) {
    return this.listBranches.execute(user);
  }

  @Post('branches')
  createBranch(@CurrentUser() user: AuthUser, @Body() dto: CreateBranchDto) {
    return this.createBranchUc.execute(user, dto);
  }

  @Patch('branches/:id')
  updateBranch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.updateBranchUc.execute(user, id, dto);
  }

  @Put('branches/:id/hours')
  setHours(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetBranchHoursDto,
  ) {
    return this.updateBranchUc.setHours(user, id, dto);
  }

  @Delete('branches/:id')
  @HttpCode(204)
  async deleteBranch(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.deleteBranchUc.execute(user, id);
  }

  // ── Chairs ────────────────────────────────────────────────────────────────
  @Get('branches/:branchId/chairs')
  chairs(
    @CurrentUser() user: AuthUser,
    @Param('branchId') branchId: string,
  ) {
    return this.listChairs.execute(user, branchId);
  }

  @Post('branches/:branchId/chairs')
  createChair(
    @CurrentUser() user: AuthUser,
    @Param('branchId') branchId: string,
    @Body() dto: CreateChairDto,
  ) {
    return this.createChairUc.execute(user, branchId, dto);
  }

  @Patch('chairs/:id')
  updateChair(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateChairDto,
  ) {
    return this.updateChairUc.execute(user, id, dto);
  }

  @Delete('chairs/:id')
  @HttpCode(204)
  async retireChair(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.retireChairUc.execute(user, id);
  }
}
