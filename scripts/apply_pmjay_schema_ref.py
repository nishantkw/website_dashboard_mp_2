"""Generate SQL + schemaRegistry entries from pmjay_schema_ref_extract.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACT = ROOT / "backend/src/data/pmjay_schema_ref_extract.json"
REGISTRY = ROOT / "backend/src/data/schemaRegistry.json"
SQL_OUT = ROOT / "backend/sql/010_pmjay_schema_ref_tables.sql"

MODULE_BY_TABLE = {
    "already_printed_card_no_290626": ("bis", "BIS Card Printing"),
    "already_printed_card_no_34321992_8672488_09082026": ("bis", "BIS Card Printing"),
    "card_print_data_madhya_pradesh_01aug2025": ("bis", "BIS Card Printing"),
    "card_print_data_madhya_pradesh_vvs_29may2025_f": ("bis", "BIS Card Printing"),
    "card_print_data_temp_t_bis_ekyc_dtl_mp_20260703_with_village_name": ("bis", "BIS Card Printing"),
    "left_over_cards_for_print_of_mp_with_village_name_09aug2026_final": ("bis", "BIS Card Printing"),
    "pvtg_by_district_7march_v3": ("beneficiaries", "Beneficiaries"),
    "t_beneficiary_ekyc_dtls_17july2025_old": ("beneficiaries", "Beneficiaries"),
    "t_bis_beneficiary_disabled_19aug2025": ("beneficiaries", "Beneficiaries"),
    "m_status_bis": ("workflow", "Users & Workflow"),
    "m_status_tms": ("workflow", "Users & Workflow"),
    "t_hem_manpower": ("hospitals", "Hospitals & Empanelment"),
    "json_data": ("claims", "Claims & Payments"),
    "treatment_stratification_details": ("patients", "Patients & Treatment"),
}

LABELS = {
    "already_printed_card_no_290626": "Already Printed Cards (29-Jun batch)",
    "already_printed_card_no_34321992_8672488_09082026": "Already Printed Cards (09-Aug batch)",
    "card_print_data_madhya_pradesh_01aug2025": "Card Print Data MP (01-Aug-2025)",
    "card_print_data_madhya_pradesh_vvs_29may2025_f": "Card Print Data MP VVS (29-May-2025)",
    "card_print_data_temp_t_bis_ekyc_dtl_mp_20260703_with_village_name": "Card Print Temp e-KYC MP (03-Jul-2026)",
    "left_over_cards_for_print_of_mp_with_village_name_09aug2026_final": "Leftover Cards for Print MP (09-Aug-2026)",
    "pvtg_by_district_7march_v3": "PVTG by District",
    "t_beneficiary_ekyc_dtls_17july2025_old": "Beneficiary e-KYC Details (17-Jul-2025)",
    "t_bis_beneficiary_disabled_19aug2025": "BIS Beneficiary Disabled (19-Aug-2025)",
    "m_status_bis": "BIS Status Master",
    "m_status_tms": "TMS Status Master",
    "t_hem_manpower": "HEM Hospital Manpower",
    "json_data": "Claim Line Items (json_data)",
    "treatment_stratification_details": "Treatment Stratification Details",
}

PK_PRIORITY = [
    "id_pk",
    "manpower_id_pk",
    "id",
    "registration_id",
    "card_no",
    "status",
]


def guess_pk(cols):
    names = {c["name"] for c in cols}
    for p in PK_PRIORITY:
        if p in names:
            return p
    return cols[0]["name"] if cols else None


def labelize(name):
    return LABELS.get(name) or name.replace("_", " ").title()


def main():
    tables = json.loads(EXTRACT.read_text(encoding="utf-8"))
    reg = json.loads(REGISTRY.read_text(encoding="utf-8"))
    existing = {t["id"] for t in reg["tables"]}

    sql_lines = [
        "-- Tables from PMJAY_dmart_mp_Schema_Reference.docx (14 tables)",
        "-- Schema: dmart_mp",
        "CREATE SCHEMA IF NOT EXISTS dmart_mp;",
        "",
    ]

    added = 0
    for name, meta in tables.items():
        cols = meta["columns"]
        if not cols:
            continue
        schema = "dmart_mp"
        tid = f"{schema}.{name}"
        module, module_label = MODULE_BY_TABLE[name]
        pk = guess_pk(cols)
        auto_pk = pk in ("id_pk", "manpower_id_pk", "id") and any(
            c["name"] == pk and c["type"] in ("bigint", "integer") for c in cols
        )

        # SQL
        sql_lines.append(f"CREATE TABLE IF NOT EXISTS {schema}.{name} (")
        col_defs = []
        for c in cols:
            typ = c["type"]
            if c["name"] == pk and auto_pk:
                col_defs.append(f"  {c['name']} {typ} PRIMARY KEY")
            else:
                col_defs.append(f"  {c['name']} {typ}")
        # If no auto PK, still declare PK when it's a real key column (except card_no-only tables)
        if not auto_pk and pk and pk != "card_no" and len(cols) > 1:
            # leave without formal PK if composite-ish; card_no-only tables have no PK
            pass
        sql_lines.append(",\n".join(col_defs))
        sql_lines.append(");")
        sql_lines.append("")

        if tid in existing:
            continue

        entry = {
            "id": tid,
            "logicalName": name,
            "schema": schema,
            "table": name,
            "label": labelize(name),
            "source": "PMJAY_dmart_mp_Schema_Reference.docx",
            "module": module,
            "moduleLabel": module_label,
            "primaryKey": pk,
            "autoGeneratePk": auto_pk,
            "columns": [{"name": c["name"], "type": c["type"]} for c in cols],
        }
        reg["tables"].append(entry)
        added += 1

    SQL_OUT.write_text("\n".join(sql_lines) + "\n", encoding="utf-8")
    REGISTRY.write_text(json.dumps(reg, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {SQL_OUT.name}")
    print(f"Added {added} registry tables (total {len(reg['tables'])})")


if __name__ == "__main__":
    main()
