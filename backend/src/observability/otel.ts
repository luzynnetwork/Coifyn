import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// Auto-instrumentations cover HTTP out of the box. pg and ioredis instrumentation
// are added explicitly below since they are not always enabled by default in the
// auto-instrumentations meta-package's bundled set for this NestJS stack.
// BullMQ has no first-party OTel instrumentation package as of this writing —
// revisit when one becomes available (or wrap job processing manually).
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';

let sdk: NodeSDK | undefined;

/**
 * Starts the OpenTelemetry Node SDK (HTTP + Postgres + Redis auto-instrumentation,
 * OTLP/HTTP trace export). Safe no-op when OTEL_EXPORTER_OTLP_ENDPOINT is unset —
 * Phase 0 deploys without a collector configured should not fail to boot.
 *
 * Called as the first thing inside bootstrap() in main.ts. For full coverage of
 * modules that run their instrumentation-relevant import-time code before Nest's
 * module graph is built, production deploys should prefer a preload, e.g.
 * `node --import ./dist/observability/otel-register.js dist/main.js` — not set up
 * in Phase 0; the in-process call below is sufficient for now.
 */
export function bootstrapOtel(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    console.log('[otel] OTEL_EXPORTER_OTLP_ENDPOINT not set — tracing disabled.');
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'coifyn-api';

  sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
    instrumentations: [
      getNodeAutoInstrumentations(),
      new PgInstrumentation(),
      new IORedisInstrumentation(),
    ],
  });

  sdk.start();
  console.log(`[otel] tracing started (service=${serviceName}, endpoint=${endpoint}).`);
}
