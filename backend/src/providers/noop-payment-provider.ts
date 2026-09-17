import { Injectable, Logger } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import type {
  CapturePaymentResult,
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  RefundPaymentResult,
} from './payment-provider.js';

/**
 * Default PaymentProvider for dev/test (STRIPE_SECRET_KEY unset). Returns
 * fake-but-shaped successful responses so callers exercise the real code paths
 * without a Stripe account.
 */
@Injectable()
export class NoopPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(NoopPaymentProvider.name);

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    const id = `pi_noop_${uuidv7()}`;
    this.logger.log(
      `createPaymentIntent (noop): ${input.amountCents} ${input.currency} -> ${id}`,
    );
    return { id, clientSecret: `${id}_secret`, status: 'requires_capture' };
  }

  async capturePayment(id: string): Promise<CapturePaymentResult> {
    this.logger.log(`capturePayment (noop): ${id}`);
    return { id, status: 'succeeded' };
  }

  async refundPayment(
    id: string,
    amountCents?: number,
  ): Promise<RefundPaymentResult> {
    this.logger.log(`refundPayment (noop): ${id} amount=${amountCents ?? 'full'}`);
    return { id: `re_noop_${uuidv7()}`, status: 'succeeded', amountCents: amountCents ?? null };
  }
}
