-- Move BIS beneficiary import target:
-- bis_raw.t_bis_beneficiary_dtls → dmart_mp.t_bis_beneficiary_dtl_hist

CREATE TABLE IF NOT EXISTS dmart_mp.t_bis_beneficiary_dtl_hist (
  id_pk bigint PRIMARY KEY,
  ben_id text,
  family_id text,
  member_id text,
  bis_family_id text,
  bis_member_id text,
  ben_ref_id text,
  state_cd text,
  dist_cd text,
  block_id text,
  village_id text,
  rural_urban_flag text,
  house_no text,
  pincode text,
  address text,
  dist_name text,
  state_name text,
  ben_mobile_no text,
  ben_email_id text,
  json_obj_ben_source_dtl text,
  json_obj_ben_ekyc_dtl text,
  obj_aadhar_vault text,
  active_status smallint,
  enrl_status text,
  created_by text,
  created_dt timestamptz,
  updated_by text,
  updated_dt timestamptz,
  abha_id text,
  payer_id bigint,
  tpa_isa_id bigint,
  json_obj_ben_othr_dtl text,
  src_flag text,
  aadhaar_no text,
  enrol_status bigint,
  entity_id text,
  card_no text,
  photo text,
  relation text,
  auth_mode text,
  primary_auth_mode text,
  new_member_flag text,
  gender text,
  year_of_birth text,
  name text,
  father_name text,
  age text,
  primary_ben_id text,
  approve_date timestamptz,
  enrol_date timestamptz,
  card_status text,
  aadhar_status text,
  reject_date timestamptz,
  date_of_birth text,
  scheme_code text,
  request_type text,
  auth_txn text,
  primary_auth_txn text,
  request_agent text,
  match_score text,
  source_type text,
  aadhaar_disp_code text,
  yob_secc text
);

DO $$
DECLARE
  col RECORD;
  shared text;
BEGIN
  IF to_regclass('bis_raw.t_bis_beneficiary_dtls') IS NULL THEN
    RETURN;
  END IF;

  FOR col IN
    SELECT c.column_name, c.udt_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'bis_raw'
      AND c.table_name = 't_bis_beneficiary_dtls'
      AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns h
        WHERE h.table_schema = 'dmart_mp'
          AND h.table_name = 't_bis_beneficiary_dtl_hist'
          AND h.column_name = c.column_name
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE dmart_mp.t_bis_beneficiary_dtl_hist ADD COLUMN IF NOT EXISTS %I %s',
      col.column_name,
      col.udt_name
    );
  END LOOP;

  SELECT string_agg(format('%I', c.column_name), ', ' ORDER BY c.ordinal_position)
  INTO shared
  FROM information_schema.columns c
  WHERE c.table_schema = 'bis_raw'
    AND c.table_name = 't_bis_beneficiary_dtls'
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns h
      WHERE h.table_schema = 'dmart_mp'
        AND h.table_name = 't_bis_beneficiary_dtl_hist'
        AND h.column_name = c.column_name
    );

  IF shared IS NOT NULL THEN
    EXECUTE format(
      'INSERT INTO dmart_mp.t_bis_beneficiary_dtl_hist (%s) SELECT %s FROM bis_raw.t_bis_beneficiary_dtls ON CONFLICT (id_pk) DO NOTHING',
      shared,
      shared
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ben_hist_member
  ON dmart_mp.t_bis_beneficiary_dtl_hist (member_id)
  WHERE member_id IS NOT NULL AND btrim(member_id) <> '';

DO $$
BEGIN
  IF to_regclass('app_auth.import_uploads') IS NULL THEN
    RETURN;
  END IF;
  UPDATE app_auth.import_uploads
  SET table_id = 'dmart_mp.t_bis_beneficiary_dtl_hist'
  WHERE table_id = 'bis_raw.t_bis_beneficiary_dtls';
  UPDATE app_auth.import_uploads
  SET suggested_table_id = 'dmart_mp.t_bis_beneficiary_dtl_hist'
  WHERE suggested_table_id = 'bis_raw.t_bis_beneficiary_dtls';
END $$;
