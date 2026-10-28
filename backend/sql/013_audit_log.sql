CREATE SCHEMA IF NOT EXISTS app_auth;

CREATE TABLE IF NOT EXISTS app_auth.audit_log (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     BIGINT,
  username    TEXT,
  user_role   TEXT,
  action      TEXT NOT NULL,
  module      TEXT,
  details     TEXT,
  ip_address  TEXT,
  status      TEXT NOT NULL DEFAULT 'Success'
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON app_auth.audit_log (created_at DESC);
