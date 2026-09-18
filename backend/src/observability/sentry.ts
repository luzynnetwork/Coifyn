import * as Sentry from '@sentry/node';

/**
 * Initializes Sentry error reporting. Safe no-op when SENTRY_DSN is unset — most
 * local/dev/CI environments run without a Sentry project configured.
 */
export function bootstrapSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });
  console.log('[sentry] initialized.');
}
