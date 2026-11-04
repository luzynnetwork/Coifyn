/** A fresh Idempotency-Key for one money-moving attempt (payment, refund). */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
