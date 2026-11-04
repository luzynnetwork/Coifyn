import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationDispatchController } from './notification-dispatch.controller.js';
import { NotificationsRepo } from './data/notifications.repo.js';
import { NotificationTemplatesRepo } from './data/notification-templates.repo.js';
import { NotificationDeliveriesRepo } from './data/notification-deliveries.repo.js';
import { EmitNotification } from './application/emit-notification.js';
import { DispatchNotification } from './application/dispatch-notification.js';
import { ListNotifications } from './application/list-notifications.js';
import { MarkRead } from './application/mark-read.js';
import { MarkAllRead } from './application/mark-all-read.js';
import { UnreadCount } from './application/unread-count.js';
import { ListTemplates } from './application/list-templates.js';
import { CreateTemplate } from './application/create-template.js';
import { ListDeliveries } from './application/list-deliveries.js';

/**
 * Two halves. (1) The staff in-app inbox: per-recipient rows + SSE over
 * RealtimeBus (EmitNotification). (2) Phase 2 customer dispatch: catalog,
 * versioned templates, consent-aware sending and a delivery log
 * (DispatchNotification). Both emitters are exported for other feature modules.
 */
@Module({
  imports: [AuthModule, RbacModule, RealtimeModule, CustomersModule],
  controllers: [NotificationsController, NotificationDispatchController],
  providers: [
    NotificationsRepo,
    NotificationTemplatesRepo,
    NotificationDeliveriesRepo,
    EmitNotification,
    DispatchNotification,
    ListNotifications,
    MarkRead,
    MarkAllRead,
    UnreadCount,
    ListTemplates,
    CreateTemplate,
    ListDeliveries,
  ],
  exports: [EmitNotification, DispatchNotification],
})
export class NotificationsModule {}
