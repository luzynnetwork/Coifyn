import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../config/config.service.js';
import type {
  CapturePaymentResult,
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  RefundPaymentResult,
} from './payment-provider.js';

/**
 * Live Stripe implementation. The Stripe client is constructed lazily on first
 * use, not in the constructor, so a deploy with STRIPE_SECRET_KEY unset still
 * boots — it only fails when a payment method is actually called.
 */
@Injectable()
export class StripeProvider implements PaymentProvider {
  private client: Stripe | null = null;

  constructor(private readonly config: AppConfigService) {}

  private getClient(): Stripe {
    if (this.client) return this.client;
    const key = this.config.get('STRIPE_SECRET_KEY');
    if (!key) {
      throw new Error(
        'StripeProvider: STRIPE_SECRET_KEY is not set — cannot call Stripe.',
      );
    }
    this.client = new Stripe(key);
    return this.client;
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    const intent = await this.getClient().paymentIntents.create({
      amount: input.amountCents,
      currency: input.currency,
      metadata: input.metadata,
    });
    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
    };
  }

  async capturePayment(id: string): Promise<CapturePaymentResult> {
    const intent = await this.getClient().paymentIntents.capture(id);
    return { id: intent.id, status: intent.status };
  }

  async refundPayment(
    id: string,
    amountCents?: number,
  ): Promise<RefundPaymentResult> {
    const refund = await this.getClient().refunds.create({
      payment_intent: id,
      amount: amountCents,
    });
    return {
      id: refund.id,
      status: refund.status ?? 'unknown',
      amountCents: refund.amount ?? null,
    };
  }
}
