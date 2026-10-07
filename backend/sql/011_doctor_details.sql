-- Doctor identity table (registration / case / doctor contact).
-- NOT the same as dmart_mp.icd_data_doctor_details (ICD code/display table).
-- Shared column names only: registration_id, case_id, patient_state_code.
-- Unique to this table: docregnum, docname, docqualification, doccontactnumber.
CREATE SCHEMA IF NOT EXISTS dmart_mp;

CREATE TABLE IF NOT EXISTS dmart_mp.doctor_details_with_registartionandcaseid (
  patient_state_code smallint,
  registration_id text,
  case_id text,
  docregnum text,
  docname text,
  docqualification text,
  doccontactnumber text
);
