-- Manual migration — run AFTER the generated schema migration.
-- drizzle-kit does not generate roles, RLS policies or triggers; they live here
-- and are applied by db:migrate (drizzle-kit runs files in ./drizzle in order;
-- keep this lexically after the generated 0000_*.sql).
--
-- What this sets up (architecture.md §6, §8):
--   1. a restricted application role with no BYPASSRLS
--   2. Row-Level Security on every salon-scoped table
--   3. an updated_at touch trigger

-- ---------------------------------------------------------------------------
-- 1. Restricted application role
-- ---------------------------------------------------------------------------
-- The app connects as this role. It is NOT the table owner and is never granted
-- rds_superuser / neon_superuser, so RLS actually applies to it. Migrations keep
-- running as the owning role, which is what lets a backfill work at all.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'coifyn_app') THEN
    CREATE ROLE coifyn_app NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO coifyn_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO coifyn_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO coifyn_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO coifyn_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO coifyn_app;

-- ---------------------------------------------------------------------------
-- 2. Row-Level Security
-- ---------------------------------------------------------------------------
-- Helper predicates, inlined per policy (no SQL function so the planner sees them):
--   system scope   : current_setting('app.system', true) = 'on'
--   member of salon : <salon_id> IN (SELECT salon_id FROM membership
--                                    WHERE user_id = nullif(current_setting('app.user_id', true), '')::uuid)
--   bootstrap salon : <salon_id> = nullif(current_setting('app.salon_id', true), '')::uuid

-- salon_organization ---------------------------------------------------------
ALTER TABLE salon_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_organization FORCE ROW LEVEL SECURITY;
CREATE POLICY salon_organization_rls ON salon_organization
  USING (
    current_setting('app.system', true) = 'on'
    OR id IN (SELECT salon_id FROM membership
              WHERE user_id = nullif(current_setting('app.user_id', true), '')::uuid)
    OR id = nullif(current_setting('app.salon_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.system', true) = 'on'
    OR id = nullif(current_setting('app.salon_id', true), '')::uuid
    OR id IN (SELECT salon_id FROM membership
              WHERE user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  );

-- Generic salon-scoped tables ---------------------------------------------------
DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'branch', 'chair', 'role', 'role_permission', 'membership', 'branch_membership'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY %1$I_rls ON %1$I
      USING (
        current_setting('app.system', true) = 'on'
        OR salon_id = nullif(current_setting('app.salon_id', true), '')::uuid
        OR salon_id IN (SELECT salon_id FROM membership
                        WHERE user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
      WITH CHECK (
        current_setting('app.system', true) = 'on'
        OR salon_id = nullif(current_setting('app.salon_id', true), '')::uuid
        OR salon_id IN (SELECT salon_id FROM membership
                        WHERE user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      );
    $f$, t);
  END LOOP;
END $$;

-- audit_event : read-only for members of the salon; writes come from system code
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_event_rls ON audit_event
  USING (
    current_setting('app.system', true) = 'on'
    OR salon_id IN (SELECT salon_id FROM membership
                    WHERE user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  )
  WITH CHECK (current_setting('app.system', true) = 'on');

-- Tables deliberately WITHOUT a policy: user, session, password_reset (read
-- before any identity exists), permission (a global catalog), domain_event
-- (written and read only by system code).

-- ---------------------------------------------------------------------------
-- 3. updated_at touch trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_set_updated_at ON %1$I;', t);
    EXECUTE format(
      'CREATE TRIGGER %1$s_set_updated_at BEFORE UPDATE ON %1$I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END $$;
