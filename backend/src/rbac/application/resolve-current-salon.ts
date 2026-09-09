import {
  ForbiddenException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { MembershipsRepo } from '../data/memberships.repo.js';

/**
 * Resolves which salon a `client`-console request acts on. Phase 1: staff belong
 * to exactly one salon, so it is their single membership. A user with several
 * memberships needs an explicit salon selector — deferred until multi-salon
 * staff is a real requirement (the header/route mechanism is a small addition
 * once TenantContextMiddleware exists).
 *
 * Runs its own `withTenant(user.id, null)` scope so the RLS-guarded membership
 * lookup sees the caller's own rows.
 */
@Injectable()
export class ResolveCurrentSalon {
  constructor(
    private readonly database: DatabaseService,
    private readonly memberships: MembershipsRepo,
  ) {}

  async execute(user: AuthUser): Promise<string> {
    const rows = await this.database.withTenant(user.id, null, () =>
      this.memberships.listForUser(user.id),
    );
    if (rows.length === 0) {
      throw new ForbiddenException('You are not a member of any salon.');
    }
    if (rows.length > 1) {
      throw new NotImplementedException(
        'Multiple salon memberships are not yet supported for this console.',
      );
    }
    return rows[0].salonId;
  }
}
