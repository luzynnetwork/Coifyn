import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsRepo } from './data/reports.repo.js';
import { GetDayReport } from './application/get-day-report.js';
import { GetSalesByService } from './application/get-sales-by-service.js';
import { GetSalesByStylist } from './application/get-sales-by-stylist.js';
import { GetRegisterSessionReport } from './application/get-register-session-report.js';

/** Phase 1: owner basics. Read-only — no tables of its own. */
@Module({
  imports: [AuthModule, RbacModule, TenancyModule],
  controllers: [ReportsController],
  providers: [
    ReportsRepo,
    GetDayReport,
    GetSalesByService,
    GetSalesByStylist,
    GetRegisterSessionReport,
  ],
})
export class ReportsModule {}
