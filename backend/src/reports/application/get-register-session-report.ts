import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { ReportsRepo } from '../data/reports.repo.js';

/**
 * Till reconciliation. Expected cash and variance are derived here, from the
 * session's cash payments and refunds, and are never stored:
 *   expected = opening float + cash taken - cash refunded
 *   variance = counted - expected   (null until the session is closed)
 */
@Injectable()
export class GetRegisterSessionReport {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly reports: ReportsRepo,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const session = await this.reports.findSession(salonId, id);
      if (!session) throw new NotFoundException('Register session not found.');

      await this.authorize.check(user, 'report:view', {
        salonId,
        branchId: session.branchId,
      });

      const cash = await this.reports.sessionCash(salonId, id);
      const expectedMinor =
        session.openingFloatMinor + cash.takenMinor - cash.refundedMinor;
      const countedMinor = session.closingCountMinor;

      return {
        sessionId: id,
        branchId: session.branchId,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        openingFloatMinor: session.openingFloatMinor,
        cashTakenMinor: cash.takenMinor,
        cashRefundedMinor: cash.refundedMinor,
        expectedMinor,
        countedMinor,
        varianceMinor: countedMinor == null ? null : countedMinor - expectedMinor,
      };
    });
  }
}
