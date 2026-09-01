import zipfile
import xml.etree.ElementTree as ET
import re
import json
from collections import OrderedDict

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
path = r'c:\Users\bk455\Documents\website_dashboard\database_documentation.docx'
out_path = r'c:\Users\bk455\Documents\website_dashboard\backend\src\data\doc_schema_full.json'


def cell_text(tc):
    parts = []
    for t in tc.findall('.//w:t', NS):
        if t.text:
            parts.append(t.text)
    return ' '.join(parts).strip()


def map_pg_type(raw):
    c1 = raw.lower()
    if 'bigint' in c1:
        return 'bigint'
    if 'smallint' in c1:
        return 'smallint'
    if 'integer' in c1 or c1.strip() == 'int':
        return 'integer'
    if 'numeric' in c1 or 'decimal' in c1:
        return 'numeric'
    if 'timestamp' in c1:
        return 'timestamptz'
    if 'date' in c1:
        return 'date'
    if 'bool' in c1:
        return 'boolean'
    return 'text'


with zipfile.ZipFile(path) as z:
    xml = z.read('word/document.xml')
root = ET.fromstring(xml)
body = root.find('w:body', NS)

tables_data = OrderedDict()
current_table = None

for child in body:
    tag = child.tag.split('}')[-1]
    if tag == 'p':
        txt = ''.join(t.text or '' for t in child.findall('.//w:t', NS)).strip()
        m = re.match(r'5\.\d+\.\s*Table:\s*(.+)', txt)
        if m:
            current_table = m.group(1).strip()
            tables_data[current_table] = {'schema': 'dmart_mp', 'columns': []}
            continue
        if current_table and txt.startswith('Schema:'):
            sm = re.search(r'Schema:\s*(\w+)', txt)
            if sm:
                tables_data[current_table]['schema'] = sm.group(1)
    elif tag == 'tbl' and current_table:
        rows = child.findall('w:tr', NS)
        for tr in rows:
            cells = [cell_text(tc) for tc in tr.findall('w:tc', NS)]
            if len(cells) < 2:
                continue
            c0, c1 = cells[0].lower().strip(), cells[1].lower().strip()
            if c0 in ('column name', 'column', 'field'):
                continue
            if c0 in ('and', 'or', 'as', 'the', 'is', 'a', 'an'):
                continue
            if re.match(r'^[a-z][a-z0-9_]*$', c0):
                tables_data[current_table]['columns'].append({'name': c0, 'type': map_pg_type(c1)})

for t, meta in tables_data.items():
    seen = set()
    unique = []
    for c in meta['columns']:
        if c['name'] not in seen:
            seen.add(c['name'])
            unique.append(c)
    meta['columns'] = unique

print('tables parsed', len(tables_data))
for k, v in tables_data.items():
    print(k, v['schema'], len(v['columns']))

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(tables_data, f, indent=2)
