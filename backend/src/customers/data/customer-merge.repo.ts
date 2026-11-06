import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../../persistence/database.service.js';

/** Tables whose rows simply re-point from the merged customer to the survivor. */
const REPOINT_TABLES = [
  'appointment',
  'queue_entry',
  'ticket',
  'cut_record',
  'formula_entry',
  'customer_note',
  'loyalty_ledger',
] as const;

@Injectable()
export class CustomerMergeRepo {
  constructor(private readonly database: DatabaseService) {}

  /** Moves every child row of `mergedId` onto `survivorId`, folds the counters
   *  and loyalty balance, and soft-deletes the merged record. Runs in the
   *  caller's transaction. */
  async merge(salonId: string, survivorId: string, mergedId: string) {
    const db = this.database.db;
    for (const table of REPOINT_TABLES) {
      await db.execute(
        sql`update ${sql.identifier(table)} set customer_id = ${survivorId}
            where salon_id = ${salonId} and customer_id = ${mergedId}`,
      );
    }
    // Tags are unique per (customer, tag): move the ones the survivor lacks.
    await db.execute(sql`
      update customer_tag set customer_id = ${survivorId}
      where salon_id = ${salonId} and customer_id = ${mergedId}
        and tag not in (select tag from customer_tag
                        where salon_id = ${salonId} and customer_id = ${survivorId})`);
    await db.execute(sql`
      delete from customer_tag
      where salon_id = ${salonId} and customer_id = ${mergedId}`);

    // Loyalty balance folds into the survivor's account (created on demand).
    await db.execute(sql`
      insert into loyalty_account (id, salon_id, customer_id, points_balance)
      select gen_random_uuid(), ${salonId}, ${survivorId}, 0
      where not exists (
        select 1 from loyalty_account where customer_id = ${survivorId})`);
    await db.execute(sql`
      update loyalty_account set points_balance = points_balance + coalesce(
        (select points_balance from loyalty_account where customer_id = ${mergedId}), 0)
      where customer_id = ${survivorId}`);
    await db.execute(
      sql`delete from loyalty_account where customer_id = ${mergedId}`,
    );

    await db.execute(sql`
      update salon_customer s set
        visit_count = s.visit_count + m.visit_count,
        total_spend_minor = s.total_spend_minor + m.total_spend_minor,
        last_visit_at = greatest(s.last_visit_at, m.last_visit_at),
        first_seen_at = least(s.first_seen_at, m.first_seen_at)
      from salon_customer m
      where s.id = ${survivorId} and m.id = ${mergedId}
        and s.salon_id = ${salonId}`);
    await db.execute(sql`
      update salon_customer set deleted_at = now()
      where id = ${mergedId} and salon_id = ${salonId}`);
  }
}
