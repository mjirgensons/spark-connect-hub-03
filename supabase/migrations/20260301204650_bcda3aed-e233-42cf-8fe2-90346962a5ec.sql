CREATE OR REPLACE FUNCTION public.get_full_schema_dump()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result TEXT := '';
  tbl RECORD;
  col RECORD;
  idx RECORD;
  pol RECORD;
  fk RECORD;
  trg RECORD;
  tbl_count BIGINT;
  sample_vals TEXT;
BEGIN
  result := '# SUPABASE LIVE DATABASE SCHEMA' || E'\n';
  result := result || '# Generated: ' || NOW()::TEXT || E'\n';
  result := result || '# Schema: public' || E'\n';
  result := result || '========================================' || E'\n\n';

  FOR tbl IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', tbl.table_name) INTO tbl_count;

    result := result || '## TABLE: ' || tbl.table_name || ' (' || tbl_count || ' rows)' || E'\n';
    result := result || '----------------------------------------' || E'\n';

    result := result || 'COLUMNS:' || E'\n';
    FOR col IN
      SELECT
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = tbl.table_name
      ORDER BY c.ordinal_position
    LOOP
      result := result || '  ' || col.column_name || ' — ';

      IF col.data_type = 'USER-DEFINED' THEN
        result := result || col.udt_name;
      ELSIF col.data_type = 'character varying' AND col.character_maximum_length IS NOT NULL THEN
        result := result || 'varchar(' || col.character_maximum_length || ')';
      ELSE
        result := result || col.data_type;
      END IF;

      IF col.is_nullable = 'NO' THEN
        result := result || ' NOT NULL';
      END IF;

      IF col.column_default IS NOT NULL THEN
        result := result || ' DEFAULT ' || col.column_default;
      END IF;

      result := result || E'\n';
    END LOOP;

    FOR idx IN
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = tbl.table_name
        AND tc.constraint_type = 'PRIMARY KEY'
    LOOP
      result := result || 'PRIMARY KEY: ' || idx.column_name || E'\n';
    END LOOP;

    FOR fk IN
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = tbl.table_name
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
      result := result || 'FK: ' || fk.column_name || ' -> ' || fk.foreign_table || '(' || fk.foreign_column || ')' || E'\n';
    END LOOP;

    FOR idx IN
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = tbl.table_name
        AND indexname NOT LIKE '%_pkey'
    LOOP
      result := result || 'INDEX: ' || idx.indexname || E'\n';
    END LOOP;

    -- FIXED: correct pg_policies columns are policyname and cmd
    FOR pol IN
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl.table_name
    LOOP
      result := result || 'RLS: ' || pol.policyname || ' (' || pol.cmd || ')' || E'\n';
    END LOOP;

    FOR trg IN
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
        AND event_object_table = tbl.table_name
      GROUP BY trigger_name
    LOOP
      result := result || 'TRIGGER: ' || trg.trigger_name || E'\n';
    END LOOP;

    FOR col IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl.table_name
        AND (
          column_name LIKE '%type%'
          OR column_name LIKE '%status%'
          OR column_name LIKE '%category%'
          OR column_name LIKE '%role%'
          OR column_name LIKE '%direction%'
          OR column_name = 'locale'
          OR column_name LIKE '%_key'
        )
        AND data_type IN ('text', 'character varying', 'USER-DEFINED')
      ORDER BY column_name
    LOOP
      BEGIN
        EXECUTE format(
          'SELECT string_agg(DISTINCT %I::text, '', '' ORDER BY %I::text) FROM (SELECT %I FROM public.%I WHERE %I IS NOT NULL LIMIT 1000) sub',
          col.column_name, col.column_name, col.column_name, tbl.table_name, col.column_name
        ) INTO sample_vals;

        IF sample_vals IS NOT NULL AND LENGTH(sample_vals) < 500 THEN
          result := result || 'ENUM VALUES [' || col.column_name || ']: ' || sample_vals || E'\n';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END LOOP;

    result := result || E'\n';
  END LOOP;

  result := result || '## RPC FUNCTIONS:' || E'\n';
  FOR tbl IN
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      AND routine_name NOT LIKE 'validate_%'
      AND routine_name NOT LIKE 'update_%'
    ORDER BY routine_name
  LOOP
    result := result || '  ' || tbl.routine_name || '()' || E'\n';
  END LOOP;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_full_schema_dump() TO authenticated;

NOTIFY pgrst, 'reload schema';