import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { communicationConsents } from '../../persistence/schema/index.js';

@Injectable()
export class CommunicationConsentsRepo {
  constructor(private readonly database: DatabaseService) {}

  list(salonId: string, customerId: string) {
    return this.database.db.query.communicationConsents.findMany({
      where: and(
        eq(communicationConsents.salonId, salonId),
        eq(communicationConsents.customerId, customerId),
      ),
    });
  }

  /** True when the customer has granted this channel/purpose. */
  async isGranted(
    salonId: string,
    customerId: string,
    channel: string,
    purpose: string,
  ): Promise<boolean> {
    const row = await this.database.db.query.communicationConsents.findFirst({
      where: and(
        eq(communicationConsents.salonId, salonId),
        eq(communicationConsents.customerId, customerId),
        eq(communicationConsents.channel, channel),
        eq(communicationConsents.purpose, purpose),
      ),
    });
    return row?.status === 'granted';
  }

  async set(
    salonId: string,
    customerId: string,
    channel: string,
    purpose: string,
    status: 'granted' | 'revoked',
  ) {
    const [row] = await this.database.db
      .insert(communicationConsents)
      .values({ id: uuidv7(), salonId, customerId, channel, purpose, status })
      .onConflictDoUpdate({
        target: [
          communicationConsents.customerId,
          communicationConsents.channel,
          communicationConsents.purpose,
        ],
        set: { status, at: new Date() },
      })
      .returning();
    return row;
  }
}
