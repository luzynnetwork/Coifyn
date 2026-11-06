import { Inject, Injectable } from '@nestjs/common';
import { CommunicationConsentsRepo } from '../../customers/data/communication-consents.repo.js';
import { CustomerPreferencesRepo } from '../../customers/data/customer-preferences.repo.js';
import { CustomersRepo } from '../../customers/data/customers.repo.js';
import { EventBus } from '../../events/event-bus.js';
import {
  NOTIFICATION_PROVIDER,
  type NotificationChannel,
  type NotificationProvider,
} from '../../providers/notification-provider.js';
import { NOTIFICATION_CATALOG, type NotificationKey } from '../catalog/notification-catalog.js';
import { NotificationDeliveriesRepo } from '../data/notification-deliveries.repo.js';
import { NotificationTemplatesRepo } from '../data/notification-templates.repo.js';
import { renderTemplate } from '../domain/render-template.js';

export interface DispatchInput {
  salonId: string;
  key: NotificationKey;
  customerId: string;
  data: Record<string, unknown>;
  /** A repeat with the same key is dropped (reminders run on a timer). */
  dedupeKey?: string;
}

export type DispatchResult =
  | { status: 'sent' | 'failed' | 'skipped'; deliveryId?: string }
  | { status: 'duplicate' };

/**
 * Sends one customer-facing message from the catalog. Runs on whatever scope
 * the caller holds (a request transaction or `withSystem`), so the delivery row
 * commits with the caller's state change.
 *
 * Channel: the customer's preferred channel, else email when they have one,
 * else SMS. WhatsApp is accepted as a preference but is delivered over SMS until
 * a WhatsApp provider is bound. Marketing-purpose keys require granted consent;
 * transactional keys always send.
 */
@Injectable()
export class DispatchNotification {
  constructor(
    private readonly customers: CustomersRepo,
    private readonly preferences: CustomerPreferencesRepo,
    private readonly consents: CommunicationConsentsRepo,
    private readonly templates: NotificationTemplatesRepo,
    private readonly deliveries: NotificationDeliveriesRepo,
    private readonly events: EventBus,
    @Inject(NOTIFICATION_PROVIDER) private readonly provider: NotificationProvider,
  ) {}

  async execute(input: DispatchInput): Promise<DispatchResult> {
    const { salonId, key } = input;
    if (
      input.dedupeKey &&
      (await this.deliveries.findByDedupeKey(salonId, input.dedupeKey))
    ) {
      return { status: 'duplicate' };
    }

    const customer = await this.customers.findById(salonId, input.customerId);
    if (!customer) return { status: 'skipped' };

    const entry = NOTIFICATION_CATALOG[key];
    const preference = await this.preferences.find(salonId, customer.id);
    const wanted = preference?.communicationChannel ?? null;
    const channel: NotificationChannel =
      wanted === 'email' || (!wanted && customer.email) ? 'email' : 'sms';
    const recipient = channel === 'email' ? (customer.email ?? '') : customer.phone;

    const override = await this.templates.latest(salonId, key, channel);
    const body = renderTemplate(override?.body ?? entry.body, {
      customerName: customer.name,
      ...input.data,
    });

    const base = {
      salonId,
      templateKey: key,
      channel,
      recipient,
      customerId: customer.id,
      body,
      dedupeKey: input.dedupeKey ?? null,
    };

    const consented =
      entry.transactional ||
      (await this.consents.isGranted(salonId, customer.id, channel, 'marketing'));
    if (!consented || !recipient) {
      const row = await this.deliveries.create({
        ...base,
        status: 'skipped',
        failureReason: !recipient ? 'no recipient address' : 'no marketing consent',
      });
      return { status: 'skipped', deliveryId: row.id };
    }

    await this.events.emit({
      aggregateType: 'notification',
      aggregateId: customer.id,
      type: 'NotificationQueued',
      salonId,
      payload: { templateKey: key },
    });

    try {
      await this.provider.send(recipient, channel, key, { body, ...input.data });
      const row = await this.deliveries.create({
        ...base,
        status: 'sent',
        failureReason: null,
      });
      await this.events.emit({
        aggregateType: 'notification',
        aggregateId: row.id,
        type: 'NotificationDelivered',
        salonId,
        payload: { deliveryId: row.id },
      });
      return { status: 'sent', deliveryId: row.id };
    } catch (err) {
      const row = await this.deliveries.create({
        ...base,
        status: 'failed',
        failureReason: (err as Error).message,
      });
      await this.events.emit({
        aggregateType: 'notification',
        aggregateId: row.id,
        type: 'NotificationFailed',
        salonId,
        payload: { deliveryId: row.id },
      });
      return { status: 'failed', deliveryId: row.id };
    }
  }
}
