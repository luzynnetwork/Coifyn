import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { notificationDeliveries } from '../../persistence/schema/index.js';

export type NotificationDeliveryRow =
  typeof notificationDeliveries.$inferSelect;

@Injectable()
export class NotificationDeliveriesRepo {
  constructor(private readonly database: DatabaseService) {}

  findByDedupeKey(salonId: string, dedupeKey: string) {
    return this.database.db.query.notificationDeliveries.findFirst({
      where: and(
        eq(notificationDeliveries.salonId, salonId),
        eq(notificationDeliveries.dedupeKey, dedupeKey),
      ),
    });
  }

  async create(input: {
    salonId: string;
    templateKey: string;
    channel: string;
    recipient: string;
    customerId: string | null;
    status: 'sent' | 'failed' | 'skipped';
    failureReason: string | null;
    body: string;
    dedupeKey: string | null;
  }): Promise<NotificationDeliveryRow> {
    const [row] = await this.database.db
      .insert(notificationDeliveries)
      .values({ id: uuidv7(), ...input })
      .returning();
    return row;
  }

  list(salonId: string, from?: Date, to?: Date) {
    return this.database.db.query.notificationDeliveries.findMany({
      where: and(
        eq(notificationDeliveries.salonId, salonId),
        from ? gte(notificationDeliveries.createdAt, from) : undefined,
        to ? lt(notificationDeliveries.createdAt, to) : undefined,
      ),
      orderBy: desc(notificationDeliveries.createdAt),
      limit: 200,
    });
  }
}
