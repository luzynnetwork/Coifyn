import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { customerPreferences } from '../../persistence/schema/index.js';

export type CustomerPreferenceRow = typeof customerPreferences.$inferSelect;
export type CustomerPreferencePatch = Partial<
  Pick<
    CustomerPreferenceRow,
    | 'preferredStylistId'
    | 'preferredChairId'
    | 'drink'
    | 'conversationLevel'
    | 'communicationChannel'
  >
>;

@Injectable()
export class CustomerPreferencesRepo {
  constructor(private readonly database: DatabaseService) {}

  find(salonId: string, customerId: string) {
    return this.database.db.query.customerPreferences.findFirst({
      where: and(
        eq(customerPreferences.salonId, salonId),
        eq(customerPreferences.customerId, customerId),
      ),
    });
  }

  async upsert(
    salonId: string,
    customerId: string,
    patch: CustomerPreferencePatch,
  ): Promise<CustomerPreferenceRow> {
    const [row] = await this.database.db
      .insert(customerPreferences)
      .values({ id: uuidv7(), salonId, customerId, ...patch })
      .onConflictDoUpdate({
        target: customerPreferences.customerId,
        set: patch,
      })
      .returning();
    return row;
  }
}
