ALTER TABLE app_auth.import_uploads
  ALTER COLUMN stored_path DROP NOT NULL,
  ALTER COLUMN extract_path DROP NOT NULL;
