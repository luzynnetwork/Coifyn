import { Injectable, Logger } from '@nestjs/common';
import type {
  NotificationChannel,
  NotificationProvider,
} from './notification-provider.js';

/**
 * Dev default NotificationProvider (MAIL_HOST unset). Logs the notification
 * instead of delivering it, via Nest's Logger (as pino-http is wired at the app
 * level through nestjs-pino).
 */
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  async send(
    to: string,
    channel: NotificationChannel,
    template: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(
      `[${channel}] to=${to} template=${template} data=${JSON.stringify(data)}`,
    );
  }
}
