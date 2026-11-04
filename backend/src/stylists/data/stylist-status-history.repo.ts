import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { stylistStatusHistory } from '../../persistence/schema/index.js';

export type StylistStatusHistoryRow = typeof stylistStatusHistory.$inferSelect;

/** Insert-only — the history is an immutable audit trail, so this repo
 *  deliberately has no update() or delete() method. */
@Injectable()
export class StylistStatusHistoryRepo {
  constructor(private readonly database: DatabaseService) {}

  listForStylist(stylistId: string): Promise<StylistStatusHistoryRow[]> {
    return this.database.db.query.stylistStatusHistory.findMany({
      where: eq(stylistStatusHistory.stylistId, stylistId),
      orderBy: desc(stylistStatusHistory.at),
    });
  }

  async append(input: {
    salonId: string;
    stylistId: string;
    status: string;
    reason: string | null;
    changedBy: string;
  }): Promise<StylistStatusHistoryRow> {
    const [row] = await this.database.db
      .insert(stylistStatusHistory)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }
}
