import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { RealtimeBus } from '../../realtime/realtime-bus.js';
import { NotificationsRepo } from '../data/notifications.repo.js';
import { assertImplemented, type NotificationType } from '../notification-types.js';

export interface EmitNotificationInput {
  type: NotificationType;
  recipientUserId?: string;
  recipientCustomerId?: string;
  payload: Record<string, unknown>;
}

/**
 * Raises a notification: validates it against the registry, persists one row,
 * then pushes it onto the RealtimeBus for any live SSE subscriber. Other
 * modules call `execute()` — this is the only way a notification is created.
 */
@Injectable()
export class EmitNotification {
  constructor(
    private readonly database: DatabaseService,
    private readonly repo: NotificationsRepo,
    private readonly bus: RealtimeBus,
  ) {}

  async execute(input: EmitNotificationInput): Promise<void> {
    if (!input.recipientUserId && !input.recipientCustomerId) {
      throw new Error(
        'EmitNotification requires recipientUserId or recipientCustomerId.',
      );
    }
    const payload = assertImplemented(input.type, input.payload);

    // The notification table has no RLS — a recipient is a user or customer
    // identity, not a salon — and the caller here may itself be running
    // outside any one salon's scope (e.g. a cross-salon system job). Run
    // under the system scope, same as the outbox relay.
    const row = await this.database.withSystem(() =>
      this.repo.create({
        recipientUserId: input.recipientUserId,
        recipientCustomerId: input.recipientCustomerId,
        type: input.type,
        payload,
      }),
    );

    const topic = input.recipientUserId
      ? `notif:user:${input.recipientUserId}`
      : `notif:customer:${input.recipientCustomerId}`;
    this.bus.publish(topic, {
      id: row.id,
      type: row.type,
      payload: row.payload,
      createdAt: row.createdAt,
    });
  }
}
