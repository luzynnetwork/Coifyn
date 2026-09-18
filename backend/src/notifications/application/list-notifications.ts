import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../persistence/database.service.js';
import type { PageQuery, Paginated } from '../../common/pagination.js';
import { paginated } from '../../common/pagination.js';
import {
  NotificationsRepo,
  type NotificationRow,
} from '../data/notifications.repo.js';
import type { NotificationPrincipal } from '../notification-principal.js';

@Injectable()
export class ListNotifications {
  constructor(
    private readonly database: DatabaseService,
    private readonly repo: NotificationsRepo,
  ) {}

  async execute(
    principal: NotificationPrincipal,
    query: PageQuery,
  ): Promise<Paginated<NotificationRow>> {
    return this.database.withSystem(async () => {
      const [items, total] = await Promise.all([
        this.repo.listForRecipient(principal, { limit: query.limit }),
        this.repo.countForRecipient(principal),
      ]);
      return paginated(items, total, query);
    });
  }
}
