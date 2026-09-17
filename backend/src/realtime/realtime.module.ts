import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RealtimeBus } from './realtime-bus.js';
import { RealtimeController } from './realtime.controller.js';

/**
 * SSE transport. Owns no persistence table of its own — it fans out domain
 * events and app-level notifications over the RealtimeBus. Exports
 * RealtimeBus so notifications.module.ts (and any future feature module) can
 * publish onto it.
 */
@Module({
  imports: [AuthModule, RbacModule],
  controllers: [RealtimeController],
  providers: [RealtimeBus],
  exports: [RealtimeBus],
})
export class RealtimeModule {}
