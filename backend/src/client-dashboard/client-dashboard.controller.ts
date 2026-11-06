import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetDashboard } from './application/get-dashboard.js';
import { DashboardQuery } from './dto/dashboard.dto.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ClientDashboardController {
  constructor(private readonly dashboardUc: GetDashboard) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser, @Query() q: DashboardQuery) {
    return this.dashboardUc.execute(user, q.branchId, q.range, q.compare);
  }
}
