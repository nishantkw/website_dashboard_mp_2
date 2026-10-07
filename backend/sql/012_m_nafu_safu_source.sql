-- NAFU / SAFU source feed (from m_nafu_safu_source.csv schema dump)
CREATE SCHEMA IF NOT EXISTS dmart_mp;

CREATE TABLE IF NOT EXISTS dmart_mp.m_nafu_safu_source (
  id integer,
  suspicious_id text,
  state_code integer,
  pmrssm_id text,
  trigger_timestamp timestamptz,
  status text,
  trigger_reason text,
  trigger_description text,
  suspicious_entity text,
  risk_score integer,
  trigger_type text,
  file_name text,
  status_sent_by_state text,
  fraud_not_fraud text,
  flag integer,
  api_response_date timestamptz,
  state_cases_push_date timestamptz,
  safu_action text,
  updated_by text,
  updated_dt timestamptz
);
