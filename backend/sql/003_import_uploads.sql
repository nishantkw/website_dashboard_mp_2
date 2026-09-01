CREATE SCHEMA IF NOT EXISTS app_auth;

CREATE TABLE IF NOT EXISTS app_auth.import_uploads (
  id uuid PRIMARY KEY,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  stored_path text NOT NULL,
  extract_path text NOT NULL,
  table_id text,
  suggested_table_id text,
  headers jsonb NOT NULL DEFAULT '[]'::jsonb,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_count integer NOT NULL DEFAULT 0,
  preview jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'parsed',
  import_mode text,
  inserted integer,
  skipped integer,
  import_errors jsonb,
  imported_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_uploads_created ON app_auth.import_uploads (created_at DESC);
