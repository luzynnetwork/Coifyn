import { Injectable } from '@nestjs/common';
import type {
  NotificationChannel,
  NotificationProvider,
} from './notification-provider.js';

/**
 * SMS NotificationProvider — stub only. No 'twilio' package dependency yet;
 * this class exists so the wiring (module, token) is in place ahead of the SMS
 * phase.
 */
@Injectable()
export class TwilioNotificationProvider implements NotificationProvider {
  async send(
    _to: string,
    _channel: NotificationChannel,
    _template: string,
    _data: Record<string, unknown>,
  ): Promise<void> {
    // TODO(phase X): implement SMS sending via the Twilio SDK once the SMS
    // notifications phase lands.
    throw new Error(
      'TwilioNotificationProvider not implemented — lands in a later phase (SMS notifications)',
    );
  }
}
