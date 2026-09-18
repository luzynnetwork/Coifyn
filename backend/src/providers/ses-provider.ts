import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { AppConfigService } from '../config/config.service.js';
import type {
  NotificationChannel,
  NotificationProvider,
} from './notification-provider.js';

/**
 * Email NotificationProvider. Despite the filename (kept per the Phase 0 task
 * spec, which names this seam "ses-provider"), this currently talks SMTP via
 * nodemailer against Mailpit locally (MAIL_HOST/MAIL_PORT) — a real, working
 * send path for local dev. It is deliberately swappable: a later phase can
 * replace the nodemailer transport here with @aws-sdk/client-ses without
 * touching NOTIFICATION_PROVIDER call sites.
 *
 * Only handles the 'email' channel; 'sms' throws.
 */
@Injectable()
export class SesNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(SesNotificationProvider.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: AppConfigService) {}

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    const host = this.config.get('MAIL_HOST');
    if (!host) {
      throw new Error(
        'SesNotificationProvider: MAIL_HOST is not set — mail is not configured.',
      );
    }
    const port = this.config.get('MAIL_PORT') ?? 1025;
    const user = this.config.get('MAIL_USER');
    const password = this.config.get('MAIL_PASSWORD');
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.config.get('MAIL_SECURE') === 'true',
      auth: user && password ? { user, pass: password } : undefined,
    });
    return this.transporter;
  }

  async send(
    to: string,
    channel: NotificationChannel,
    template: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (channel !== 'email') {
      throw new Error(
        `SesNotificationProvider only handles the 'email' channel, got '${channel}'.`,
      );
    }
    const from = this.config.get('MAIL_FROM') ?? 'no-reply@coifyn.app';
    const info = await this.getTransporter().sendMail({
      from,
      to,
      subject: template,
      text: JSON.stringify(data),
    });
    this.logger.debug(`email sent template=${template} to=${to} id=${info.messageId}`);
  }
}
