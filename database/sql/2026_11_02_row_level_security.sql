-- Habuilt row-level security for the Supabase anon/authenticated API.
-- The table owner and the service_role bypass RLS. Laravel uses that privileged connection.
-- anon receives no policies. A signed-in user can touch a row only when auth.uid() matches the owner.
-- Partner connections are visible to either participant. habit_check_ins is never opened to a partner.
-- Apply with App\Services\Ledger\SpaLedgerGuard (migration and `php artisan habuilt:secure-ledger`).

DO $habuilt_rls$
DECLARE
  owner_table text;
BEGIN
  -- section:owner_tables
  FOREACH owner_table IN ARRAY ARRAY[
    'habit_check_ins',
    'user_settings',
    'user_protocols',
    'user_biomarkers',
    'user_monthly_states',
    'household_days',
    'user_reward_items',
    'user_reward_redemptions'
  ]
  LOOP
    IF to_regclass('public.' || owner_table) IS NULL THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = owner_table
        AND column_name = 'user_id'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', owner_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', owner_table || '_select_own', owner_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', owner_table || '_insert_own', owner_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', owner_table || '_update_own', owner_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', owner_table || '_delete_own', owner_table);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text)',
      owner_table || '_select_own',
      owner_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text)',
      owner_table || '_insert_own',
      owner_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text)',
      owner_table || '_update_own',
      owner_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid()::text = user_id::text)',
      owner_table || '_delete_own',
      owner_table
    );

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', owner_table);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated',
        owner_table
      );
    END IF;
  END LOOP;
  -- endsection:owner_tables

  -- section:partner_connections
  IF to_regclass('public.partner_connections') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'partner_connections'
         AND column_name = 'user_id'
     )
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'partner_connections'
         AND column_name = 'partner_user_id'
     )
  THEN
    ALTER TABLE public.partner_connections ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS partner_connections_select_participant ON public.partner_connections;
    DROP POLICY IF EXISTS partner_connections_insert_own ON public.partner_connections;
    DROP POLICY IF EXISTS partner_connections_update_participant ON public.partner_connections;
    DROP POLICY IF EXISTS partner_connections_delete_participant ON public.partner_connections;

    CREATE POLICY partner_connections_select_participant
      ON public.partner_connections
      FOR SELECT
      TO authenticated
      USING (
        auth.uid()::text = user_id::text
        OR auth.uid()::text = partner_user_id::text
      );

    CREATE POLICY partner_connections_insert_own
      ON public.partner_connections
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = user_id::text);

    CREATE POLICY partner_connections_update_participant
      ON public.partner_connections
      FOR UPDATE
      TO authenticated
      USING (
        auth.uid()::text = user_id::text
        OR auth.uid()::text = partner_user_id::text
      )
      WITH CHECK (
        auth.uid()::text = user_id::text
        OR auth.uid()::text = partner_user_id::text
      );

    CREATE POLICY partner_connections_delete_participant
      ON public.partner_connections
      FOR DELETE
      TO authenticated
      USING (
        auth.uid()::text = user_id::text
        OR auth.uid()::text = partner_user_id::text
      );

    CREATE OR REPLACE FUNCTION public.habuilt_partner_connection_lock_owner()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $lock_owner$
    BEGIN
      IF NEW.user_id::text IS DISTINCT FROM OLD.user_id::text THEN
        RAISE EXCEPTION 'user_id is immutable';
      END IF;
      RETURN NEW;
    END;
    $lock_owner$;

    DROP TRIGGER IF EXISTS habuilt_partner_connection_lock_owner ON public.partner_connections;
    CREATE TRIGGER habuilt_partner_connection_lock_owner
      BEFORE UPDATE ON public.partner_connections
      FOR EACH ROW
      EXECUTE FUNCTION public.habuilt_partner_connection_lock_owner();

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.partner_connections FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.partner_connections TO authenticated;
    END IF;
  END IF;
  -- endsection:partner_connections
END
$habuilt_rls$;
