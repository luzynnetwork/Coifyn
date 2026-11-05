import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';
import { LoyaltyRulesRepo } from '../data/loyalty-rules.repo.js';
import { PointsPoster } from './points-poster.js';

/** The `loyalty-expiry` job. For salons with an expiry policy, an account with
 *  no activity for `expiryDays` loses its balance (one `expire` ledger row).
 *  System scope — spans salons. */
@Injectable()
export class ExpirePoints {
  constructor(
    private readonly database: DatabaseService,
    private readonly rules: LoyaltyRulesRepo,
    private readonly poster: PointsPoster,
  ) {}

  execute(now = new Date()): Promise<{ expired: number }> {
    return this.database.withSystem(async () => {
      let expired = 0;
      for (const rule of await this.rules.listWithExpiry()) {
        const cutoff = new Date(now.getTime() - rule.expiryDays! * 86400000);
        const idle = await this.database.db.execute<{
          customer_id: string;
          points_balance: number;
        }>(sql`
          select a.customer_id, a.points_balance
          from loyalty_account a
          where a.salon_id = ${rule.salonId} and a.points_balance > 0
            and coalesce((select max(l.created_at) from loyalty_ledger l
                          where l.customer_id = a.customer_id), a.created_at) < ${cutoff.toISOString()}::timestamptz`);
        for (const row of idle) {
          await this.poster.post({
            salonId: rule.salonId,
            customerId: row.customer_id,
            kind: 'expire',
            delta: -row.points_balance,
            source: 'expiry',
            reason: `inactive ${rule.expiryDays} days`,
          });
          expired++;
        }
      }
      return { expired };
    });
  }
}
