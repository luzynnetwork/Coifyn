import type { Options, PostgresType } from 'postgres';

/**
 * Builds the `postgres` driver options from the environment, supporting two
 * auth modes:
 *
 *   1. Plain — `DATABASE_URL=postgres://user:pass@host/db`. Used as-is.
 *   2. AWS RDS IAM — `DB_IAM_AUTH=true` plus `DB_HOST`, `DB_PORT`, `DB_NAME`,
 *      `DB_USER`, `AWS_REGION`. The password is a short-lived (15 min) auth
 *      token, so it is supplied as an async function the driver calls on every
 *      new connection rather than a fixed string. Needs AWS credentials on the
 *      process (env vars, shared config, or an instance role in prod) and
 *      `sslmode=require`.
 *
 * Migrations and the app both go through here so the two never drift.
 */
export interface DbEnv {
  DATABASE_URL?: string;
  DB_IAM_AUTH?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  AWS_REGION?: string;
}

export function isIamAuth(env: DbEnv): boolean {
  return env.DB_IAM_AUTH === 'true';
}

export interface ResolvedConnection {
  /** Passed to postgres() as the first arg when not IAM. */
  url?: string;
  /** Passed to postgres() as the options arg. */
  options: Options<Record<string, PostgresType>>;
}

export async function resolveConnection(
  env: DbEnv,
  overrides: Partial<Options<Record<string, PostgresType>>> = {},
): Promise<ResolvedConnection> {
  if (!isIamAuth(env)) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set (and DB_IAM_AUTH is not "true").');
    }
    return { url: env.DATABASE_URL, options: { prepare: false, ...overrides } };
  }

  const host = required(env, 'DB_HOST');
  const port = Number(env.DB_PORT ?? 5432);
  const database = required(env, 'DB_NAME');
  const user = required(env, 'DB_USER');
  const region = required(env, 'AWS_REGION');

  // Lazy import so a non-IAM deploy never pulls the AWS SDK.
  const { Signer } = await import('@aws-sdk/rds-signer');
  const signer = new Signer({ hostname: host, port, username: user, region });

  return {
    options: {
      host,
      port,
      database,
      user,
      // Called per new connection — always a fresh token.
      password: () => signer.getAuthToken(),
      ssl: 'require',
      prepare: false,
      ...overrides,
    },
  };
}

function required(env: DbEnv, key: keyof DbEnv): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} is required when DB_IAM_AUTH="true".`);
  }
  return value;
}
