import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { TenancyController } from './tenancy.controller.js';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware.js';
import { SalonsRepo } from './data/salons.repo.js';
import { BranchesRepo } from './data/branches.repo.js';
import { ChairsRepo } from './data/chairs.repo.js';
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

/**
 * Salon / branch / chair — the tenant hierarchy, plus salon-owner onboarding.
 * Depends on RbacModule for authorize(), resolve-current-salon and
 * provision-standard-roles.
 */
@Module({
  imports: [AuthModule, RbacModule],
  controllers: [TenancyController],
  providers: [
    SalonsRepo,
    BranchesRepo,
    ChairsRepo,
    CreateSalon,
    GetMySalon,
    UpdateSalon,
    ListBranches,
    CreateBranch,
    UpdateBranch,
    DeleteBranch,
    ListChairs,
    CreateChair,
    UpdateChair,
    RetireChair,
  ],
  exports: [SalonsRepo, BranchesRepo, ChairsRepo],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
