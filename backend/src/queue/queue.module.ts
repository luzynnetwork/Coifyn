import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { ServicesModule } from '../services/services.module.js';
import { StylistsModule } from '../stylists/stylists.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { QueueController } from './queue.controller.js';
import { QueueEntriesRepo } from './data/queue-entries.repo.js';
import { QueueTransitioner } from './application/queue-transitioner.js';
import { ListQueue } from './application/list-queue.js';
import { JoinQueue } from './application/join-queue.js';
import { AssignQueueEntry } from './application/assign-queue-entry.js';
import { StartQueueEntry } from './application/start-queue-entry.js';
import { CompleteQueueEntry } from './application/complete-queue-entry.js';
import { RemoveQueueEntry } from './application/remove-queue-entry.js';
import { GetWaitEstimate } from './application/get-wait-estimate.js';

/** Phase 1: the walk-in line. Every mutation publishes `queue:<branchId>`. */
@Module({
  imports: [
    AuthModule,
    RbacModule,
    RealtimeModule,
    TenancyModule,
    StylistsModule,
    ServicesModule,
    CustomersModule,
  ],
  controllers: [QueueController],
  providers: [
    QueueEntriesRepo,
    QueueTransitioner,
    ListQueue,
    JoinQueue,
    AssignQueueEntry,
    StartQueueEntry,
    CompleteQueueEntry,
    RemoveQueueEntry,
    GetWaitEstimate,
  ],
  exports: [QueueEntriesRepo],
})
export class QueueModule {}
