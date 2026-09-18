import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { SalonSetupController } from './salon-setup.controller.js';
import { BranchHoursRepo } from './data/branch-hours.repo.js';
import { BranchClosuresRepo } from './data/branch-closures.repo.js';
import { TaxRatesRepo } from './data/tax-rates.repo.js';
import { GetBranchHours } from './application/get-branch-hours.js';
import { SetBranchHours } from './application/set-branch-hours.js';
import { ListBranchClosures } from './application/list-branch-closures.js';
import { CreateBranchClosure } from './application/create-branch-closure.js';
import { DeleteBranchClosure } from './application/delete-branch-closure.js';
import { ListTaxRates } from './application/list-tax-rates.js';
import { CreateTaxRate } from './application/create-tax-rate.js';
import { UpdateTaxRate } from './application/update-tax-rate.js';

/**
 * Phase 1 — branch hours, closures and tax rates. Extends the Phase 0
 * tenancy hierarchy (Salon/Branch/Chair); depends on TenancyModule for
 * BranchesRepo (existence checks) rather than duplicating branch lookups.
 */
@Module({
  imports: [AuthModule, RbacModule, TenancyModule],
  controllers: [SalonSetupController],
  providers: [
    BranchHoursRepo,
    BranchClosuresRepo,
    TaxRatesRepo,
    GetBranchHours,
    SetBranchHours,
    ListBranchClosures,
    CreateBranchClosure,
    DeleteBranchClosure,
    ListTaxRates,
    CreateTaxRate,
    UpdateTaxRate,
  ],
  exports: [TaxRatesRepo],
})
export class SalonSetupModule {}
