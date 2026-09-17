import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { NotificationsRepo } from '../data/notifications.repo.js';
import type { NotificationPrincipal } from '../notification-principal.js';

@Injectable()
export class MarkRead {
  constructor(
    private readonly database: DatabaseService,
    private readonly repo: NotificationsRepo,
  ) {}

  async execute(
    principal: NotificationPrincipal,
    notificationId: string,
  ): Promise<void> {
    await this.database.withSystem(async () => {
      const row = await this.repo.findById(notificationId);
      if (!row) throw new NotFoundException('Notification not found.');
      const owns =
        principal.kind === 'user'
          ? row.recipientUserId === principal.id
          : row.recipientCustomerId === principal.id;
      if (!owns) {
        throw new ForbiddenException('Not your notification.');
      }
      await this.repo.markRead(notificationId);
    });
  }
}
