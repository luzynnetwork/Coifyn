import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../persistence/database.service.js';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  /** Liveness — the process is up. No dependency checks. */
  @Get('health')
  live() {
    return { status: 'ok' };
  }

  /** Readiness — dependencies the app cannot serve without. */
  @Get('health/ready')
  async ready() {
    const checks: Record<string, 'ok' | 'fail'> = { database: 'fail' };
    try {
      await this.database.unsafeRoot.execute(sql`select 1`);
      checks.database = 'ok';
    } catch {
      /* leave as fail */
    }
    const ok = Object.values(checks).every((c) => c === 'ok');
    return { status: ok ? 'ok' : 'degraded', checks };
  }
}
