-- id_pk is serial/int4 on many tables. NHA BIS keys (e.g. 100005858984)
-- exceed integer max (2147483647). Migration 005 missed columns ending in _pk.

DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema IN ('bis_raw', 'dmart_mp', 'ump_raw')
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('integer', 'smallint')
      AND (
        c.column_name = 'id_pk'
        OR c.column_name LIKE '%\_pk' ESCAPE '\'
        OR c.column_name ~ '(id|code|no|number)$'
      )
      AND c.column_name NOT IN ('m_flag', 'status_id', 'status_id_pk')
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE %I.%I ALTER COLUMN %I TYPE bigint USING %I::bigint',
        rec.table_schema, rec.table_name, rec.column_name, rec.column_name
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip %.%.%: %', rec.table_schema, rec.table_name, rec.column_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- serial sequences stay int4 until widened
DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schema_name, s.relname AS seq_name
    FROM pg_class s
    JOIN pg_namespace n ON n.oid = s.relnamespace
    WHERE s.relkind = 'S'
      AND n.nspname IN ('bis_raw', 'dmart_mp', 'ump_raw')
  LOOP
    BEGIN
      EXECUTE format('ALTER SEQUENCE %I.%I AS bigint', rec.schema_name, rec.seq_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip sequence %.%: %', rec.schema_name, rec.seq_name, SQLERRM;
    END;
  END LOOP;
END $$;
