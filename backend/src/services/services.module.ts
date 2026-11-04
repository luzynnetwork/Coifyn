import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { SalonSetupModule } from '../salon-setup/salon-setup.module.js';
import { ServicesController } from './services.controller.js';
import { ServiceCategoriesRepo } from './data/service-categories.repo.js';
import { ServicesRepo } from './data/services.repo.js';
import { ServiceAddOnsRepo } from './data/service-add-ons.repo.js';
import { ServiceAddOnLinksRepo } from './data/service-add-on-links.repo.js';
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

/**
 * Phase 1 — the service menu. Depends on SalonSetupModule for TaxRatesRepo, to
 * validate a Service's `taxRateId` belongs to the same salon before accepting it.
 */
@Module({
  imports: [AuthModule, RbacModule, SalonSetupModule],
  controllers: [ServicesController],
  providers: [
    ServiceCategoriesRepo,
    ServicesRepo,
    ServiceAddOnsRepo,
    ServiceAddOnLinksRepo,
    ListServices,
    GetService,
    CreateService,
    UpdateService,
    DeleteService,
    SetServiceActive,
    ListServiceCategories,
    CreateServiceCategory,
    UpdateServiceCategory,
    ListServiceAddOns,
    CreateServiceAddOn,
    UpdateServiceAddOn,
  ],
  exports: [ServicesRepo, ServiceAddOnsRepo, ServiceCategoriesRepo],
})
export class ServicesModule {}
