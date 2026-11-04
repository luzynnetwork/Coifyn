import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { DisruptionsController } from './disruptions.controller.js';
import { DisruptionsRepo } from './data/disruptions.repo.js';
import { DisruptionOffersRepo } from './data/disruption-offers.repo.js';
import { StandInFinder } from './application/stand-in-finder.js';
import { DeclareDisruption } from './application/declare-disruption.js';
import { DeclareRunningLate } from './application/declare-running-late.js';
import { ListAffected } from './application/list-affected.js';
import { NotifyDisruption } from './application/notify-disruption.js';
import { ListDisruptions } from './application/list-disruptions.js';
import { ResolveOffer } from './application/resolve-offer.js';
import { EscalateStaleOffers } from './application/escalate-stale-offers.js';
import { DisruptionWorker } from './disruption.worker.js';

/** Phase 2: running-late and absence handling — declare, notify the affected
 *  customers with options, record their choice, escalate the unanswered. */
@Module({
  imports: [
    AuthModule,
    RbacModule,
    RealtimeModule,
    StylistsModule,
    AppointmentsModule,
    CustomersModule,
    NotificationsModule,
  ],
  controllers: [DisruptionsController],
  providers: [
    DisruptionsRepo,
    DisruptionOffersRepo,
    StandInFinder,
    DeclareDisruption,
    DeclareRunningLate,
    ListAffected,
    NotifyDisruption,
    ListDisruptions,
    ResolveOffer,
    EscalateStaleOffers,
    DisruptionWorker,
  ],
  exports: [EscalateStaleOffers],
})
export class DisruptionsModule {}
