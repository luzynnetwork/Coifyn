-- Phase 2 tenant tables: Row-Level Security keyed on salon_id, same policy as
-- 0001 (members of the salon, the declared bootstrap salon, or system code).
-- Idempotent. The updated_at trigger is re-applied by 0001 only for tables that
-- existed then, so it is re-run here for the new ones.
DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'stylist_shift', 'shift_template', 'stylist_time_off',
    'booking_hold', 'appointment_reschedule', 'booking_request',
    'disruption', 'disruption_offer',
    'cut_record', 'cut_record_photo', 'formula_entry',
    'customer_preference', 'customer_tag', 'customer_note', 'communication_consent',
    'loyalty_rule', 'loyalty_account', 'loyalty_ledger',
    'notification_template', 'notification_delivery'
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
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_set_updated_at ON %1$I;', t);
    EXECUTE format(
      'CREATE TRIGGER %1$s_set_updated_at BEFORE UPDATE ON %1$I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO coifyn_app;
