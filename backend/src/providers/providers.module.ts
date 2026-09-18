import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module.js';
import { AppConfigService } from '../config/config.service.js';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider.js';
import { StripeProvider } from './stripe-provider.js';
import { NoopPaymentProvider } from './noop-payment-provider.js';
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from './notification-provider.js';
import { SesNotificationProvider } from './ses-provider.js';
import { ConsoleNotificationProvider } from './console-provider.js';
import { TwilioNotificationProvider } from './twilio-provider.js';
import { OBJECT_STORE } from './object-store.js';
import { S3ObjectStore } from './s3-provider.js';
import { SEARCH_INDEX } from './search-index.js';
import { PostgresSearchProvider } from './postgres-search-provider.js';

/**
 * Phase 0 provider seams. Each infra dependency (payments, notifications,
 * object storage, search) is bound behind an interface token here, chosen by
 * env presence (mirrors redis.module.ts's useFactory + inject pattern) so
 * feature modules depend on the interface, never the concrete SDK.
 */
@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    StripeProvider,
    NoopPaymentProvider,
    SesNotificationProvider,
    ConsoleNotificationProvider,
    // Provided under its own class token too: not yet routed to by
    // NOTIFICATION_PROVIDER (see comment below), but available for direct
    // injection ahead of the SMS phase.
    TwilioNotificationProvider,
    S3ObjectStore,
    PostgresSearchProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [AppConfigService, StripeProvider, NoopPaymentProvider],
      useFactory: (
        config: AppConfigService,
        stripe: StripeProvider,
        noop: NoopPaymentProvider,
      ): PaymentProvider => (config.get('STRIPE_SECRET_KEY') ? stripe : noop),
    },
    {
      // NotificationProvider is channel-agnostic in this minimal Phase 0
      // scope, so only one implementation is bound to the interface token —
      // mail (Ses/Console) vs SMS is not yet routed by channel here. A later
      // phase can make this a router that dispatches 'sms' to
      // TwilioNotificationProvider and 'email' to the mail provider.
      provide: NOTIFICATION_PROVIDER,
      inject: [AppConfigService, SesNotificationProvider, ConsoleNotificationProvider],
      useFactory: (
        config: AppConfigService,
        ses: SesNotificationProvider,
        console_: ConsoleNotificationProvider,
      ): NotificationProvider => (config.get('MAIL_HOST') ? ses : console_),
    },
    {
      provide: OBJECT_STORE,
      useExisting: S3ObjectStore,
    },
    {
      provide: SEARCH_INDEX,
      useExisting: PostgresSearchProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER, NOTIFICATION_PROVIDER, OBJECT_STORE, SEARCH_INDEX],
})
export class ProvidersModule {}
