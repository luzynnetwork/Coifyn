import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ProblemJsonFilter } from './common/filters/problem-json.filter.js';
import { IdempotencyInterceptor } from './common/idempotency/idempotency.interceptor.js';

/**
 * The global wiring shared by the real bootstrap (main.ts) and the e2e harness,
 * so tests exercise exactly the pipeline production runs: URI versioning under
 * /api/v1, whitelisting ValidationPipe, RFC-7807 filter, idempotency interceptor.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });
  app.enableVersioning();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ProblemJsonFilter());
  app.useGlobalInterceptors(app.get(IdempotencyInterceptor));
}
