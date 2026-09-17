import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../persistence/database.service.js';
import { REDIS, type RedisConnection } from '../redis/redis.module.js';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly database: DatabaseService,
    @Inject(REDIS) private readonly redis: RedisConnection,
  ) {}

  /** Liveness — the process is up. No dependency checks. */
  @Get('health')
  live() {
    return { status: 'ok' };
  }

  /** Readiness — dependencies the app cannot serve without. */
  @Get('health/ready')
  async ready() {
    const checks: Record<string, 'ok' | 'fail' | 'skipped'> = {
      database: 'fail',
      redis: 'skipped',
    };
    try {
      await this.database.unsafeRoot.execute(sql`select 1`);
      checks.database = 'ok';
    } catch {
      /* leave as fail */
    }

    if (this.redis) {
      try {
        await this.redis.ping();
        checks.redis = 'ok';
      } catch {
        checks.redis = 'fail';
      }
    }

    const ok = Object.values(checks).every((c) => c === 'ok' || c === 'skipped');
    return { status: ok ? 'ok' : 'degraded', checks };
  }
}
