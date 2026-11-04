import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { notificationTemplates } from '../../persistence/schema/index.js';

export type NotificationTemplateRow = typeof notificationTemplates.$inferSelect;

@Injectable()
export class NotificationTemplatesRepo {
  constructor(private readonly database: DatabaseService) {}

  list(salonId: string): Promise<NotificationTemplateRow[]> {
    return this.database.db.query.notificationTemplates.findMany({
      where: and(
        eq(notificationTemplates.salonId, salonId),
        isNull(notificationTemplates.deletedAt),
      ),
      orderBy: [desc(notificationTemplates.version)],
    });
  }

  /** The salon's newest override for key+channel, if any. */
  latest(salonId: string, key: string, channel: string) {
    return this.database.db.query.notificationTemplates.findFirst({
      where: and(
        eq(notificationTemplates.salonId, salonId),
        eq(notificationTemplates.key, key),
        eq(notificationTemplates.channel, channel),
        isNull(notificationTemplates.deletedAt),
      ),
      orderBy: [desc(notificationTemplates.version)],
    });
  }

  /** Inserts the next version of key+channel (1 when none exists). */
  async createVersion(input: {
    salonId: string;
    key: string;
    channel: string;
    body: string;
    variables: string[];
  }): Promise<NotificationTemplateRow> {
    const previous = await this.latest(input.salonId, input.key, input.channel);
    const [row] = await this.database.db
      .insert(notificationTemplates)
      .values({
        id: uuidv7(),
        ...input,
        version: (previous?.version ?? 0) + 1,
      })
      .returning();
    return row;
  }
}
