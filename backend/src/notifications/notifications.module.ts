import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepo } from './data/notifications.repo.js';
import { EmitNotification } from './application/emit-notification.js';
import { ListNotifications } from './application/list-notifications.js';
import { MarkRead } from './application/mark-read.js';
import { MarkAllRead } from './application/mark-all-read.js';
import { UnreadCount } from './application/unread-count.js';

/**
 * Per-recipient notification rows + SSE delivery over RealtimeBus.
 * EmitNotification is exported so other feature modules can raise a
 * notification without depending on the rest of this module's internals.
 */
@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepo,
    EmitNotification,
    ListNotifications,
    MarkRead,
    MarkAllRead,
    UnreadCount,
  ],
  exports: [EmitNotification],
})
export class NotificationsModule {}
