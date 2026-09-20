import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DayReportQuery, SalesRangeQuery } from './dto/report.dto.js';
import { GetDayReport } from './application/get-day-report.js';
import { GetSalesByService } from './application/get-sales-by-service.js';
import { GetSalesByStylist } from './application/get-sales-by-stylist.js';
import { GetRegisterSessionReport } from './application/get-register-session-report.js';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ReportsController {
  constructor(
    private readonly dayUc: GetDayReport,
    private readonly byServiceUc: GetSalesByService,
    private readonly byStylistUc: GetSalesByStylist,
    private readonly sessionUc: GetRegisterSessionReport,
  ) {}

  @Get('reports/day')
  day(@CurrentUser() user: AuthUser, @Query() q: DayReportQuery) {
    return this.dayUc.execute(user, q.branchId, q.date);
  }

  @Get('reports/sales/by-service')
  byService(@CurrentUser() user: AuthUser, @Query() q: SalesRangeQuery) {
    return this.byServiceUc.execute(user, q.from, q.to, q.branchId);
  }

  @Get('reports/sales/by-stylist')
  byStylist(@CurrentUser() user: AuthUser, @Query() q: SalesRangeQuery) {
    return this.byStylistUc.execute(user, q.from, q.to, q.branchId);
  }

  @Get('reports/register-session/:id')
  registerSession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessionUc.execute(user, id);
  }
}
