import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
renames = {
    "card_print_data_temp_t_bis_ekyc_dtl_mp_20260703_with_village_name": "card_print_data_temp_t_bis_ekyc_dtl_mp_20260703_with_village_na",
    "left_over_cards_for_print_of_mp_with_village_name_09aug2026_final": "left_over_cards_for_print_of_mp_with_village_name_09aug2026_fin",
}

reg_path = ROOT / "backend/src/data/schemaRegistry.json"
reg = json.loads(reg_path.read_text(encoding="utf-8"))
for t in reg["tables"]:
    for old, new in renames.items():
        if t.get("table") == old or t.get("logicalName") == old:
            t["table"] = new
            t["logicalName"] = new
            t["id"] = f"dmart_mp.{new}"
            print("registry:", old, "->", new)

reg_path.write_text(json.dumps(reg, indent=2) + "\n", encoding="utf-8")

sql_path = ROOT / "backend/sql/010_pmjay_schema_ref_tables.sql"
sql = sql_path.read_text(encoding="utf-8")
for old, new in renames.items():
    sql = sql.replace(old, new)
sql_path.write_text(sql, encoding="utf-8")
print("done")
