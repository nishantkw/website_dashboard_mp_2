import zipfile
import xml.etree.ElementTree as ET
import re
import json
from collections import OrderedDict
from pathlib import Path

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "PMJAY_dmart_mp_Schema_Reference.docx"
out_path = ROOT / "backend" / "src" / "data" / "pmjay_schema_ref_extract.json"


def cell_text(tc):
    parts = []
    for t in tc.findall(".//w:t", NS):
        if t.text:
            parts.append(t.text)
    return " ".join(parts).strip()


def map_pg_type(raw):
    c1 = (raw or "").lower()
    if "bigint" in c1:
        return "bigint"
    if "smallint" in c1:
        return "smallint"
    if "integer" in c1 or re.search(r"\bint\b", c1):
        return "integer"
    if "numeric" in c1 or "decimal" in c1 or "double" in c1 or "float" in c1:
        return "numeric"
    if "timestamp" in c1:
        return "timestamptz"
    if "date" in c1:
        return "date"
    if "bool" in c1:
        return "boolean"
    return "text"


with zipfile.ZipFile(path) as z:
    xml = z.read("word/document.xml")
root = ET.fromstring(xml)
body = root.find("w:body", NS)

items = []
for child in body:
    tag = child.tag.split("}")[-1]
    if tag == "p":
        txt = "".join(t.text or "" for t in child.findall(".//w:t", NS)).strip()
        if txt:
            items.append(("p", txt))
    elif tag == "tbl":
        rows = []
        for tr in child.findall("w:tr", NS):
            cells = [cell_text(tc) for tc in tr.findall("w:tc", NS)]
            rows.append(cells)
        items.append(("tbl", rows))

tables = OrderedDict()
current = None

for kind, content in items:
    if kind == "p":
        m = re.match(r"^([a-z][a-z0-9_]{3,})$", content.strip())
        if m:
            current = m.group(1)
            if current not in tables:
                tables[current] = {"description": "", "columns": []}
        elif current and not tables[current].get("description") and len(content) > 30:
            tables[current]["description"] = content[:600]
    elif kind == "tbl" and current is not None:
        cols = []
        header = [c.lower() for c in content[0]] if content else []
        # Find column indices from header
        try:
            name_i = next(i for i, h in enumerate(header) if h in ("column", "column name", "column_name", "field", "name"))
        except StopIteration:
            name_i = 1 if len(header) > 1 else 0
        try:
            type_i = next(i for i, h in enumerate(header) if "type" in h or h == "data type")
        except StopIteration:
            type_i = name_i + 1
        try:
            desc_i = next(i for i, h in enumerate(header) if "desc" in h)
        except StopIteration:
            desc_i = None

        for row in content[1:]:
            if len(row) <= name_i:
                continue
            name = row[name_i].strip()
            if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name):
                continue
            typ_raw = row[type_i].strip() if type_i < len(row) else ""
            desc = row[desc_i].strip() if desc_i is not None and desc_i < len(row) else ""
            cols.append({"name": name.lower(), "type": map_pg_type(typ_raw), "desc": desc})

        if cols:
            seen = set()
            unique = []
            for c in cols:
                if c["name"] not in seen:
                    seen.add(c["name"])
                    unique.append(c)
            # Only set if empty (first schema table after heading wins)
            if not tables[current]["columns"]:
                tables[current]["columns"] = unique

print("=== EXTRACTED TABLES ===")
for name, meta in tables.items():
    print(f"\n## {name} ({len(meta['columns'])} cols)")
    print(f"desc: {meta.get('description', '')[:160]}")
    for c in meta["columns"]:
        d = f" — {c['desc']}" if c.get("desc") else ""
        print(f"  {c['name']}: {c['type']}{d}")

out_path.write_text(json.dumps(tables, indent=2), encoding="utf-8")
print(f"\nSaved {len(tables)} tables to {out_path}")

# Verify association: print last para before each tbl
print("\n=== TABLE ASSOCIATION CHECK ===")
last_name = None
for kind, content in items:
    if kind == "p":
        m = re.match(r"^([a-z][a-z0-9_]{3,})$", content.strip())
        if m:
            last_name = m.group(1)
    elif kind == "tbl":
        ncols = max(0, len(content) - 1)
        first_cols = [r[1] if len(r) > 1 else r[0] for r in content[1:4]]
        print(f"{last_name}: {ncols} cols, sample={first_cols}")
