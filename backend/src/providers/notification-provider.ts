/** DI token for the active NotificationProvider implementation. */
export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');

export type NotificationChannel = 'email' | 'sms';

/** Outbound notification seam, channel-agnostic in this Phase 0 scope. */
export interface NotificationProvider {
  send(
    to: string,
    channel: NotificationChannel,
    template: string,
    data: Record<string, unknown>,
  ): Promise<void>;
}
