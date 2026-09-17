/** DI token for the active PaymentProvider implementation (providers.module.ts
 *  chooses Stripe vs Noop by env presence). */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface CreatePaymentIntentInput {
  amountCents: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string | null;
  status: string;
}

export interface CapturePaymentResult {
  id: string;
  status: string;
}

export interface RefundPaymentResult {
  id: string;
  status: string;
  amountCents: number | null;
}

/**
 * Payment gateway seam. Kept minimal and not tied to any schema table — callers
 * pass plain DTOs in, get plain DTOs back.
 */
export interface PaymentProvider {
  createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult>;
  capturePayment(id: string): Promise<CapturePaymentResult>;
  refundPayment(id: string, amountCents?: number): Promise<RefundPaymentResult>;
}
