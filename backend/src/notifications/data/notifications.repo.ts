import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { DatabaseService } from '../../persistence/database.service.js';
import { notifications } from '../../persistence/schema/index.js';
import type { NotificationPrincipal } from '../notification-principal.js';

export type NotificationRow = typeof notifications.$inferSelect;

function recipientClause(recipient: NotificationPrincipal) {
  return recipient.kind === 'user'
    ? eq(notifications.recipientUserId, recipient.id)
    : eq(notifications.recipientCustomerId, recipient.id);
}

@Injectable()
export class NotificationsRepo {
  constructor(private readonly database: DatabaseService) {}

  async create(input: {
    recipientUserId?: string;
    recipientCustomerId?: string;
    type: string;
    payload: Record<string, unknown>;
  }): Promise<NotificationRow> {
    const [row] = await this.database.db
      .insert(notifications)
      .values({
        id: uuidv7(),
        recipientUserId: input.recipientUserId ?? null,
        recipientCustomerId: input.recipientCustomerId ?? null,
        type: input.type,
        payload: input.payload,
      })
      .returning();
    return row;
  }

  findById(id: string): Promise<NotificationRow | undefined> {
    return this.database.db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
  }

  listForRecipient(
    recipient: NotificationPrincipal,
    opts: { limit: number; afterCreatedAt?: Date },
  ): Promise<NotificationRow[]> {
    return this.database.db.query.notifications.findMany({
      where: opts.afterCreatedAt
        ? and(
            recipientClause(recipient),
            gt(notifications.createdAt, opts.afterCreatedAt),
          )
        : recipientClause(recipient),
      orderBy: desc(notifications.createdAt),
      limit: opts.limit,
    });
  }

  async countForRecipient(recipient: NotificationPrincipal): Promise<number> {
    const rows = await this.database.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(recipientClause(recipient));
    return rows.length;
  }

  async countUnreadForRecipient(
    recipient: NotificationPrincipal,
  ): Promise<number> {
    const rows = await this.database.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(recipientClause(recipient), isNull(notifications.readAt)));
    return rows.length;
  }

  async markRead(id: string): Promise<void> {
    await this.database.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), isNull(notifications.readAt)));
  }

  async markAllReadForRecipient(
    recipient: NotificationPrincipal,
  ): Promise<void> {
    await this.database.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(recipientClause(recipient), isNull(notifications.readAt)));
  }
}
