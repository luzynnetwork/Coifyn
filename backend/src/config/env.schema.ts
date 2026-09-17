import { z } from 'zod';

/**
 * Every environment variable the API reads, validated once at boot. A missing or
 * malformed value aborts startup with a readable message rather than failing
 * later at the call site (architecture.md §8).
 *
 * Phase 0 slice: only what Phase 1 needs. SSE, customer-auth, observability and
 * object storage vars land in their own phases.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  /**
   * Database connection. Two mutually exclusive modes (persistence/connection.ts):
   *   - plain:    DATABASE_URL=postgres://user:pass@host/db
   *   - RDS IAM:  DB_IAM_AUTH=true + DB_HOST/DB_PORT/DB_NAME/DB_USER/AWS_REGION
   *              (password is a short-lived IAM auth token fetched per connection)
   * The cross-field check below enforces that one of the two is fully provided.
   */
  DATABASE_URL: z.string().startsWith('postgres').optional(),
  DB_IAM_AUTH: z.enum(['true', 'false']).default('false'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  AWS_REGION: z.string().optional(),

  /** JWT signing secrets (access + refresh are signed separately so a leaked
   *  access secret cannot mint refresh tokens). */
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  /** Optional in the Phase 0 slice: when unset, the outbox relay worker does not
   *  start (events are still written to domain_event in-transaction). */
  REDIS_URL: z.string().url().optional(),

  /** Base host for per-salon subdomains, e.g. "coifyn.app" → "aurora.coifyn.app". */
  TENANT_BASE_HOST: z.string().default('localhost'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  /** Customer-portal JWT secrets. Separate from the staff JWT_* secrets above so
   *  a customer token can never authenticate a staff route. Optional so a
   *  customer-auth-free deploy doesn't need them; customer-auth's own module
   *  fails fast if it starts without them. */
  CUSTOMER_JWT_ACCESS_SECRET: z.string().min(32).optional(),
  CUSTOMER_JWT_REFRESH_SECRET: z.string().min(32).optional(),
  CUSTOMER_JWT_ACCESS_TTL: z.string().default('15m'),
  CUSTOMER_JWT_REFRESH_TTL: z.string().default('30d'),

  /** Object storage (S3-compatible — MinIO locally). Optional: ObjectStore
   *  provider falls back to a not-configured stub when unset. */
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('false'),

  /** Mail (Mailpit locally). Optional: NotificationProvider falls back to the
   *  console provider when unset. */
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_SECURE: z.enum(['true', 'false']).default('false'),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),

  /** Stripe test-mode secret key. Unset → NoopPaymentProvider is used. */
  STRIPE_SECRET_KEY: z.string().optional(),

  /** Twilio — stub provider only, throws "not implemented" until a later phase. */
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  /** OpenTelemetry / Sentry. Both no-op when unset. */
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('coifyn-api'),
  SENTRY_DSN: z.string().optional(),
}).superRefine((env, ctx) => {
  if (env.DB_IAM_AUTH === 'true') {
    for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'AWS_REGION'] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `required when DB_IAM_AUTH="true"`,
        });
      }
    }
  } else if (!env.DATABASE_URL) {
    ctx.addIssue({
      code: 'custom',
      path: ['DATABASE_URL'],
      message: 'required unless DB_IAM_AUTH="true"',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
