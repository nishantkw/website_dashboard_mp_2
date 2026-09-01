-- NHA stores long numeric IDs (e.g. registration_id 2026031910041399)
-- as varchar/bigint. Postgres integer (int4) cannot hold them.

DROP VIEW IF EXISTS dmart_mp.claim_paid_t;

ALTER TABLE dmart_mp.claim_paid_excel_t
  ALTER COLUMN registration_id TYPE text USING registration_id::text;

ALTER TABLE dmart_mp.t_patient_dtls
  ALTER COLUMN registration_id TYPE text USING registration_id::text;

ALTER TABLE dmart_mp.t_payment_dtls
  ALTER COLUMN case_id TYPE text USING case_id::text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'dmart_mp'
      AND table_name = 't_workflow_transaction_audit_hem'
      AND column_name = 'registration_id'
      AND data_type IN ('integer', 'bigint', 'smallint')
  ) THEN
    ALTER TABLE dmart_mp.t_workflow_transaction_audit_hem
      ALTER COLUMN registration_id TYPE text USING registration_id::text;
  END IF;
END $$;

-- Remaining int4 identifier columns → bigint
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
      AND c.data_type = 'integer'
      AND c.column_name ~ '(id|code|no|number)$'
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

CREATE OR REPLACE VIEW dmart_mp.claim_paid_t AS SELECT * FROM dmart_mp.claim_paid_excel_t;
