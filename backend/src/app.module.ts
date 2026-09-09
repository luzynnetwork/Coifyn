import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module.js';
import { AppConfigService } from './config/config.service.js';
import { DatabaseModule } from './persistence/database.module.js';
import { RedisModule } from './redis/redis.module.js';
import { HealthModule } from './health/health.module.js';
import { AuditModule } from './audit/audit.module.js';
import { EventsModule } from './events/events.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RbacModule } from './rbac/rbac.module.js';
import { TenancyModule } from './tenancy/tenancy.module.js';

/**
 * Phase 0 slice wiring. Feature modules (auth, rbac, tenancy, events, audit, and
 * the Phase 1 modules) are added here as they land.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          transport: config.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
          // Every log line carries the request's correlation id (architecture.md §8).
          genReqId: (req, res) => {
            const existing =
              (req.headers['x-correlation-id'] as string) ?? undefined;
            const id = existing ?? crypto.randomUUID();
            res.setHeader('x-correlation-id', id);
            return id;
          },
          customProps: (req) => ({ correlationId: (req as { id?: string }).id }),
        },
      }),
    }),
    DatabaseModule,
    RedisModule,
    EventsModule,
    AuditModule,
    HealthModule,
    AuthModule,
    RbacModule,
    TenancyModule,
  ],
})
export class AppModule {}
