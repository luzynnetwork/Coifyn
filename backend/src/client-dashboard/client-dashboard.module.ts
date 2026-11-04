import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { ClientDashboardController } from './client-dashboard.controller.js';
import { DashboardRepo } from './data/dashboard.repo.js';
import { GetDashboard } from './application/get-dashboard.js';

/** Phase 2: the salon dashboard. Every KPI states its definition, a
 *  comparison value and its source, and revenue reuses the reports queries so
 *  it reconciles with the day report. */
@Module({
  imports: [AuthModule, RbacModule, TenancyModule, StylistsModule, ReportsModule],
  controllers: [ClientDashboardController],
  providers: [DashboardRepo, GetDashboard],
})
export class ClientDashboardModule {}
