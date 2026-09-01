"""
Build schemaRegistry.json and 002_dmart_mp_extended.sql from doc_schema_full.json
Run: python scripts/build_schema_registry.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'backend/src/data/doc_schema_full.json'
SCHEMA_EXTRACT = ROOT / 'schema_extract.json'
OUT_REGISTRY = ROOT / 'backend/src/data/schemaRegistry.json'
OUT_SQL = ROOT / 'backend/sql/002_dmart_mp_extended.sql'

# Physical tables already created in 001_init_schemas.sql — do not CREATE again
EXISTING_PHYSICAL = {
    ('dmart_mp', 'claim_paid_excel_t'),
    ('dmart_mp', 't_suspicious_api_case_data'),
    ('dmart_mp', 't_suspicious_api_case_dtls'),
    ('dmart_mp', 't_workflow_transaction_audit'),
    ('dmart_mp', 'workflow_users_t'),
    ('dmart_mp', 'hospital_master'),
    ('dmart_mp', 'ump_role_dtl'),
    ('bis_raw', 't_bis_beneficiary_dtls'),
    ('ump_raw', 'user_master_ump'),
    ('ump_raw', 'ump_user_dtl'),
}

# Doc / logical table name → physical (schema, table) when different
PHYSICAL_ALIAS = {
    'claim_paid_t': ('dmart_mp', 'claim_paid_excel_t'),
    'user_master_ump': ('ump_raw', 'user_master_ump'),
}

# Dashboard module for each logical table name (doc dmart_mp tables + extras)
MODULE_BY_TABLE = {
    'claim_paid_t': 'claims',
    'claim_paid_t_portability': 'claims',
    'payment_dtls': 'claims',
    't_payment_dtls': 'claims',
    'tms_recovery': 'claims',
    't_bis_beneficiary_dtls': 'beneficiaries',
    't_bis_beneficiary_disabled': 'beneficiaries',
    't_card_printing_status': 'beneficiaries',
    'hospital_master': 'hospitals',
    'hospital_master_with_quality_certification': 'hospitals',
    'hospital_master_with_quality_certification_final': 'hospitals',
    't_deempanelment_details': 'hospitals',
    't_hem_hospital': 'hospitals',
    't_patient_dtl': 'patients',
    't_patient_dtls': 'patients',
    't_morth_patient_details': 'patients',
    'treatment_dtls': 'patients',
    'icd_data_doctor_details': 'patients',
    't_suspicious_api_case_data': 'fraud',
    't_suspicious_api_case_dtls': 'fraud',
    'workflow_users_t': 'workflow',
    'pro_workflow_users_t': 'workflow',
    't_workflow_transaction_audit': 'workflow',
    't_workflow_transaction_audit_hem': 'workflow',
    'lms_user_course_completion_status': 'lms',
    'user_master_ump': 'ump',
    'ump_user_dtl': 'ump',
    'ump_role_dtl': 'ump',
    'ump_users_v': 'ump',
    'm_lookup': 'reference',
    'm_source_data': 'reference',
    't_hem_sch_mapping': 'reference',
}

MODULE_LABELS = {
    'claims': 'Claims & Payments',
    'beneficiaries': 'Beneficiaries',
    'hospitals': 'Hospitals & Empanelment',
    'patients': 'Patients & Treatment',
    'fraud': 'Fraud and Audit',
    'workflow': 'Users & Workflow',
    'lms': 'LMS Training',
    'ump': 'UMP User Management',
    'reference': 'Reference / Lookup',
    'bis': 'BIS Card Printing',
}

PK_GUESS = [
    'id_pk', 'work_id_pk', 'suspicion_id', 'registration_id', 'case_id', 'ben_id', 'hospital_code',
]

PG_MAP = {
    'varchar': 'text',
    'character varying': 'text',
    'char': 'text',
    'text': 'text',
    'integer': 'integer',
    'int': 'integer',
    'bigint': 'bigint',
    'smallint': 'smallint',
    'numeric': 'numeric',
    'decimal': 'numeric',
    'double precision': 'double precision',
    'real': 'real',
    'boolean': 'boolean',
    'date': 'date',
    'timestamp': 'timestamptz',
    'timestamptz': 'timestamptz',
    'timestamp with time zone': 'timestamptz',
    'timestamp without time zone': 'timestamp',
    'time': 'time',
}


def pg_type(t):
    return PG_MAP.get(t.lower().strip(), 'text')


def guess_pk(columns):
    names = [c['name'] for c in columns]
    for pk in PK_GUESS:
        if pk in names:
            return pk
    return names[0] if names else 'id_pk'


def guess_auto_pk(pk, columns):
    if pk in ('id_pk', 'suspicion_id', 'work_id_pk') and pk in [c['name'] for c in columns]:
        return True
    return False


def main():
    doc = json.loads(DOC.read_text(encoding='utf-8'))
    extract = json.loads(SCHEMA_EXTRACT.read_text(encoding='utf-8'))

    registry = []
    sql_lines = [
        '-- Auto-generated from database_documentation.docx (28 dmart_mp tables)',
        '-- Run after 001_init_schemas.sql',
        '',
        'CREATE SCHEMA IF NOT EXISTS dmart_mp;',
        '',
    ]

    views_sql = []

    def add_table(schema, table_name, columns, label, source, module, logical_name=None):
        logical = logical_name or table_name
        physical = PHYSICAL_ALIAS.get(logical, (schema, table_name))
        phys_schema, phys_table = physical
        col_list = [{'name': c['name'], 'type': pg_type(c.get('type', 'text'))} for c in columns]
        pk = guess_pk(col_list)
        entry = {
            'id': f'{phys_schema}.{phys_table}',
            'logicalName': logical,
            'schema': phys_schema,
            'table': phys_table,
            'label': label,
            'source': source,
            'module': module,
            'moduleLabel': MODULE_LABELS.get(module, module),
            'primaryKey': pk,
            'autoGeneratePk': guess_auto_pk(pk, col_list),
            'columns': col_list,
        }
        # Avoid duplicate registry entries for same physical table
        if not any(r['id'] == entry['id'] and r['logicalName'] == entry['logicalName'] for r in registry):
            registry.append(entry)

    # 28 dmart_mp tables from documentation
    for table_name, columns in doc.items():
        module = MODULE_BY_TABLE.get(table_name, 'reference')
        label = table_name.replace('_', ' ').title()
        add_table(
            'dmart_mp', table_name, columns,
            label=label,
            source='database_documentation.docx',
            module=module,
            logical_name=table_name,
        )

    # dmart_mp beneficiary history (Data dictionary xlsx — import target for BIS beneficiary files)
    if 't_bis_beneficiary_dtls' in extract:
        add_table(
            'dmart_mp', 't_bis_beneficiary_dtl_hist', extract['t_bis_beneficiary_dtls'],
            label='BIS Beneficiary Details History',
            source='Data dictionary — Redshift BIS',
            module='beneficiaries',
            logical_name='t_bis_beneficiary_dtl_hist',
        )

    # hospital_master (SQL — not in 28 doc list but used by dashboard)
    hm_cols = doc.get('hospital_master_with_quality_certification_final', [])
    if hm_cols:
        # reuse subset matching hospital_master SQL columns from importTablesExtra
        hm_names = {
            'id_pk', 'hospital_code', 'facility_id', 'hospital_name', 'hospital_type',
            'district_name', 'division_name', 'hosp_spec_type', 'nabh_certified', 'enrl_status',
            'active_status', 'accreditation_status', 'empaneled_date', 'deempanel_status', 'pgdnb_status', 'bed_capacity',
        }
        hm_columns = [c for c in hm_cols if c['name'] in hm_names]
        if len(hm_columns) < 10:
            hm_columns = [{'name': n, 'type': 'text'} for n in hm_names]
        add_table(
            'dmart_mp', 'hospital_master', hm_columns,
            label='Hospital Master',
            source='SQL schema / Hospital module',
            module='hospitals',
        )

    # ump extras from schema_extract
    for tbl, meta_schema in [('ump_user_dtl', 'ump_raw'), ('ump_role_dtl', 'dmart_mp')]:
        if tbl in extract:
            add_table(
                meta_schema, tbl, extract[tbl],
                label=tbl.replace('_', ' ').title(),
                source='Data dictionary — UMP',
                module='ump',
            )

    # claim_paid_excel_t explicit entry (physical table for claims)
    if 'claim_paid_excel_t' in extract:
        add_table(
            'dmart_mp', 'claim_paid_excel_t', extract['claim_paid_excel_t'],
            label='Claims & Payments (claim_paid_excel_t)',
            source='Data dictionary — Redshift TMS',
            module='claims',
            logical_name='claim_paid_excel_t',
        )

    # Generate CREATE TABLE for dmart_mp tables not in EXISTING_PHYSICAL
    for table_name, columns in doc.items():
        if table_name == 'ump_users_v':
            views_sql.append(
                '-- VIEW ump_users_v: create when source tables populated\n'
                '-- CREATE OR REPLACE VIEW dmart_mp.ump_users_v AS SELECT ...;\n'
            )
            continue
        if table_name == 'claim_paid_t':
            views_sql.append(
                'CREATE OR REPLACE VIEW dmart_mp.claim_paid_t AS SELECT * FROM dmart_mp.claim_paid_excel_t;\n'
            )
            continue

        phys = PHYSICAL_ALIAS.get(table_name, ('dmart_mp', table_name))
        if phys in EXISTING_PHYSICAL:
            continue

        col_defs = []
        pk = guess_pk([{'name': c['name']} for c in columns])
        for c in columns:
            cn = c['name']
            if not re.match(r'^[a-z][a-z0-9_]*$', cn):
                continue
            ct = pg_type(c.get('type', 'text'))
            if cn == pk and guess_auto_pk(pk, columns):
                if ct in ('integer', 'bigint', 'smallint'):
                    col_defs.append(f'  {cn} serial PRIMARY KEY')
                else:
                    col_defs.append(f'  {cn} {ct} PRIMARY KEY')
            else:
                col_defs.append(f'  {cn} {ct}')

        if not col_defs:
            continue

        sql_lines.append(f'DROP TABLE IF EXISTS dmart_mp.{table_name} CASCADE;')
        sql_lines.append(f'CREATE TABLE dmart_mp.{table_name} (')
        sql_lines.append(',\n'.join(col_defs))
        sql_lines.append(');')
        sql_lines.append('')

    sql_lines.extend(['-- Views', ''] + views_sql)

    # Indexes for common filters
    sql_lines.extend([
        'CREATE INDEX IF NOT EXISTS idx_claim_port_case ON dmart_mp.claim_paid_t_portability (case_id);',
        'CREATE INDEX IF NOT EXISTS idx_patient_dtls_case ON dmart_mp.t_patient_dtls (case_id);',
        'CREATE INDEX IF NOT EXISTS idx_card_print_dist ON dmart_mp.t_card_printing_status (district_name);',
        'CREATE INDEX IF NOT EXISTS idx_lms_user ON dmart_mp.lms_user_course_completion_status (userid);',
        'CREATE INDEX IF NOT EXISTS idx_hosp_qual_facility ON dmart_mp.hospital_master_with_quality_certification_final (facility_id);',
    ])

    registry.sort(key=lambda r: (r['module'], r['id']))
    OUT_REGISTRY.write_text(json.dumps({'tables': registry}, indent=2), encoding='utf-8')
    OUT_SQL.write_text('\n'.join(sql_lines) + '\n', encoding='utf-8')
    print(f'Registry: {len(registry)} table entries')
    print(f'SQL written: {OUT_SQL}')


if __name__ == '__main__':
    main()
