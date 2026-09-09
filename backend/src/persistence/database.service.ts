import { AsyncLocalStorage } from 'node:async_hooks';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { AppConfigService } from '../config/config.service.js';
import {
  CURRENT_SALON_GUC,
  CURRENT_USER_GUC,
  SYSTEM_GUC,
} from './schema/_helpers.js';
import * as schema from './schema/index.js';

type Db = PostgresJsDatabase<typeof schema>;

interface Scope {
  tx: Db;
  userId: string | null;
  salonId: string | null;
  system: boolean;
}

/**
 * The one entry point to Postgres. Every tenant-scoped read/write runs inside a
 * per-request transaction that applies the RLS session settings with SET LOCAL
 * — the only safe form, since a setting applied outside a transaction survives
 * on the pooled connection and leaks to the next request. The transaction is
 * held in an AsyncLocalStorage so repositories just read `db` (architecture.md
 * §6).
 *
 * A query made outside any scope reaches Postgres with no settings, where every
 * RLS policy evaluates false — no rows, rather than all of them.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly als = new AsyncLocalStorage<Scope>();
  private sql!: postgres.Sql;
  private root!: Db;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    this.sql = postgres(this.config.get('DATABASE_URL'), {
      max: 10,
      prepare: false, // PgBouncer transaction mode
      onnotice: () => {},
    });
    this.root = drizzle(this.sql, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.sql?.end({ timeout: 5 });
  }

  /** The ambient transaction for the current scope. Throws if called with no
   *  scope open — that is a bug (a use case that forgot withTenant/withSystem),
   *  not a condition to paper over. */
  get db(): Db {
    const scope = this.als.getStore();
    if (!scope) {
      throw new Error(
        'DatabaseService.db accessed outside a tenant scope — wrap the call in withTenant() or withSystem().',
      );
    }
    return scope.tx;
  }

  /** Unscoped handle for migrations and the seed script only. */
  get unsafeRoot(): Db {
    return this.root;
  }

  /** Ordinary request scope. `salonId` is optional because most routes learn the
   *  salon from the entity they load; pass it when the request boundary already
   *  resolves one. */
  async withTenant<T>(
    userId: string,
    salonId: string | null,
    fn: () => Promise<T>,
  ): Promise<T> {
    return this.runScoped({ userId, salonId, system: false }, fn);
  }

  /** Cross-salon scope: the outbox relay, webhook handlers, seed/maintenance
   *  scripts. Bypasses tenant filtering by setting app.system. */
  async withSystem<T>(fn: () => Promise<T>): Promise<T> {
    return this.runScoped({ userId: null, salonId: null, system: true }, fn);
  }

  /** Signup: declares the salon it is about to create, so the first few rows can
   *  authorize against a membership that does not exist yet. */
  async withBootstrapSalon<T>(
    userId: string | null,
    salonId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    return this.runScoped({ userId, salonId, system: false }, fn);
  }

  private async runScoped<T>(
    scope: Omit<Scope, 'tx'>,
    fn: () => Promise<T>,
  ): Promise<T> {
    return this.root.transaction(async (tx) => {
      await tx.execute(
        sql.raw(
          setLocal(CURRENT_USER_GUC, scope.userId) +
            setLocal(CURRENT_SALON_GUC, scope.salonId) +
            setLocal(SYSTEM_GUC, scope.system ? 'on' : 'off'),
        ),
      );
      return this.als.run({ ...scope, tx }, fn);
    });
  }
}

/** SET LOCAL with a safely-quoted literal. NULL clears the setting for this tx. */
function setLocal(name: string, value: string | null): string {
  const literal =
    value === null ? `''` : `'${value.replace(/'/g, "''")}'`;
  return `SET LOCAL "${name}" = ${literal}; `;
}
