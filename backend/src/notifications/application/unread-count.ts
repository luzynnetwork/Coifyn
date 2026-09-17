import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { NotificationsRepo } from '../data/notifications.repo.js';
import type { NotificationPrincipal } from '../notification-principal.js';

@Injectable()
export class UnreadCount {
  constructor(
    private readonly database: DatabaseService,
    private readonly repo: NotificationsRepo,
  ) {}

  execute(principal: NotificationPrincipal): Promise<number> {
    return this.database.withSystem(() =>
      this.repo.countUnreadForRecipient(principal),
    );
  }
}
