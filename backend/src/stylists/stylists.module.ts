import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { StylistsController } from './stylists.controller.js';
import { StylistProfilesRepo } from './data/stylist-profiles.repo.js';
import { StylistServicesRepo } from './data/stylist-services.repo.js';
import { StylistStatusHistoryRepo } from './data/stylist-status-history.repo.js';
import { ListStylists } from './application/list-stylists.js';
import { GetStylist } from './application/get-stylist.js';
import { CreateStylist } from './application/create-stylist.js';
import { UpdateStylist } from './application/update-stylist.js';
import { SetStylistStatus } from './application/set-stylist-status.js';
import { ListStylistServices } from './application/list-stylist-services.js';
import { SetStylistServices } from './application/set-stylist-services.js';

/**
 * Phase 1 — per-barber profiles, service matrix and live status. Depends on
 * RealtimeModule to publish `stylist-status:<branchId>` on every status change.
 */
@Module({
  imports: [AuthModule, RbacModule, RealtimeModule],
  controllers: [StylistsController],
  providers: [
    StylistProfilesRepo,
    StylistServicesRepo,
    StylistStatusHistoryRepo,
    ListStylists,
    GetStylist,
    CreateStylist,
    UpdateStylist,
    SetStylistStatus,
    ListStylistServices,
    SetStylistServices,
  ],
  exports: [StylistProfilesRepo, StylistServicesRepo],
})
export class StylistsModule {}
