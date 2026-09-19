-- Manual migration — run AFTER the generated schema migration.
-- drizzle-kit does not generate roles, RLS policies or triggers; they live here
-- and are applied by db:migrate.
--
-- Sets up (architecture.md §6, §8):
--   1. a restricted application role with no BYPASSRLS
--   2. a SECURITY DEFINER helper so tenant policies can consult `membership`
--      without a table referencing its own policy (infinite recursion)
--   3. Row-Level Security on every salon-scoped table
--   4. an updated_at touch trigger

-- ---------------------------------------------------------------------------
-- 1. Restricted application role
-- ---------------------------------------------------------------------------
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
-- 2. Membership lookup helpers (SECURITY DEFINER — bypass RLS internally)
-- ---------------------------------------------------------------------------
-- The current request's user / salon from the SET LOCAL GUCs.
CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid
  LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_declared_salon_id() RETURNS uuid
  LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.salon_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_is_system() RETURNS boolean
  LANGUAGE sql STABLE AS
$$ SELECT current_setting('app.system', true) = 'on' $$;

-- The salons the current user belongs to. SECURITY DEFINER so its own read of
-- `membership` runs as the function owner and does NOT re-enter membership's RLS
-- policy — which is what a plain subquery would do (infinite recursion).
CREATE OR REPLACE FUNCTION app_salon_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT salon_id FROM membership WHERE user_id = app_user_id() $$;

REVOKE ALL ON FUNCTION app_salon_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_salon_ids() TO coifyn_app;

-- ---------------------------------------------------------------------------
-- 3. Row-Level Security
-- ---------------------------------------------------------------------------
-- salon_organization — visible when a member, the declared bootstrap salon, or system
ALTER TABLE salon_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_organization FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS salon_organization_rls ON salon_organization;
CREATE POLICY salon_organization_rls ON salon_organization
  USING (
    app_is_system()
    OR id = app_declared_salon_id()
    OR id IN (SELECT app_salon_ids())
  )
  WITH CHECK (
    app_is_system()
    OR id = app_declared_salon_id()
    OR id IN (SELECT app_salon_ids())
  );

-- Every salon-scoped table keys on salon_id.
DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'branch', 'chair', 'role', 'role_permission', 'membership', 'branch_membership',
    'branch_hours', 'branch_closure', 'tax_rate',
    'service_category', 'service', 'service_add_on', 'service_add_on_link',
    'stylist_profile', 'stylist_service', 'stylist_status_history',
    'staff_invite',
    'salon_customer',
    'queue_entry'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %1$I_rls ON %1$I;', t);
    EXECUTE format($f$
      CREATE POLICY %1$I_rls ON %1$I
      USING (
        app_is_system()
        OR salon_id = app_declared_salon_id()
        OR salon_id IN (SELECT app_salon_ids())
      )
      WITH CHECK (
        app_is_system()
        OR salon_id = app_declared_salon_id()
        OR salon_id IN (SELECT app_salon_ids())
      );
    $f$, t);
  END LOOP;
END $$;

-- audit_event : members read; writes are system-scoped
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_event_rls ON audit_event;
CREATE POLICY audit_event_rls ON audit_event
  USING (
    app_is_system()
    OR salon_id = app_declared_salon_id()
    OR salon_id IN (SELECT app_salon_ids())
  )
  WITH CHECK (app_is_system() OR salon_id = app_declared_salon_id());

-- No policy: user, session, password_reset (pre-identity), permission (global
-- catalog), domain_event (system code only).

-- ---------------------------------------------------------------------------
-- 4. updated_at touch trigger
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
