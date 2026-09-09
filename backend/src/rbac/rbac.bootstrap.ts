import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PermissionsRepo } from './data/permissions.repo.js';

/** Syncs the code-defined permission catalog into the `permission` table on
 *  every boot. Idempotent. */
@Injectable()
export class RbacBootstrap implements OnModuleInit {
  private readonly logger = new Logger(RbacBootstrap.name);

  constructor(private readonly permissions: PermissionsRepo) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.permissions.syncCatalog();
      this.logger.log('permission catalog synced');
    } catch (err) {
      // A boot that cannot reach the DB should fail loudly elsewhere (health
      // readiness); don't crash the whole process here, but make it visible.
      this.logger.error('failed to sync permission catalog', err as Error);
    }
  }
}
