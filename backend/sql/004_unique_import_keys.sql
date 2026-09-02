-- Unique business keys so the same claim / hospital / member cannot be stored twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_claim_paid_case
  ON dmart_mp.claim_paid_excel_t (case_id)
  WHERE case_id IS NOT NULL AND btrim(case_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_claim_port_case
  ON dmart_mp.claim_paid_t_portability (case_id)
  WHERE case_id IS NOT NULL AND btrim(case_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_hosp_final_id
  ON dmart_mp.hospital_master_with_quality_certification_final (hosp_id)
  WHERE hosp_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_hem_hosp_id
  ON dmart_mp.t_hem_hospital (hosp_id)
  WHERE hosp_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ben_member
  ON dmart_mp.t_bis_beneficiary_dtls (member_id)
  WHERE member_id IS NOT NULL AND btrim(member_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_card_no
  ON dmart_mp.t_card_printing_status (card_no)
  WHERE card_no IS NOT NULL AND btrim(card_no) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_case
  ON dmart_mp.t_patient_dtls (case_id)
  WHERE case_id IS NOT NULL AND btrim(case_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_fraud_ref
  ON dmart_mp.t_suspicious_api_case_data (reference_number)
  WHERE reference_number IS NOT NULL AND btrim(reference_number) <> '';
