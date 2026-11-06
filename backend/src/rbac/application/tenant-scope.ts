import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { ResolveCurrentSalon } from './resolve-current-salon.js';

/**
 * The request boundary every use case repeats: resolve the caller's salon, then
 * run the body inside that salon's RLS-scoped transaction. Phase 2 use cases use
 * this instead of re-spelling the two lines; authorization stays explicit in the
 * body (`authorize.check`) so each use case still names the permission it needs.
 */
@Injectable()
export class TenantScope {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
  ) {}

  async run<T>(
    user: AuthUser,
    fn: (salonId: string) => Promise<T>,
  ): Promise<T> {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, () => fn(salonId));
  }
}
