import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import { NotificationsRepo } from '../data/notifications.repo.js';
import type { NotificationPrincipal } from '../notification-principal.js';

@Injectable()
export class MarkAllRead {
  constructor(
    private readonly database: DatabaseService,
    private readonly repo: NotificationsRepo,
  ) {}

  async execute(principal: NotificationPrincipal): Promise<void> {
    await this.database.withSystem(() =>
      this.repo.markAllReadForRecipient(principal),
    );
  }
}
