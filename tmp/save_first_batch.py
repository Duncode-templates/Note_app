# -*- coding: utf-8 -*-
import json
import os

with open('/tmp/make_translations.py', 'r', encoding='utf-8') as f:
    code = f.read()
namespace = {}
exec(code, namespace)
en = namespace['translations']['en']

with open('/tmp/make_all_languages.py', 'r', encoding='utf-8') as f:
    es_code = f.read()
namespace_es = {}
exec(es_code, namespace_es)
es = namespace_es['all_translations']['es']

with open('/tmp/make_pt.py', 'r', encoding='utf-8') as f:
    pt_code = f.read()
namespace_pt = {}
exec(pt_code, namespace_pt)
pt = namespace_pt['pt']

def save_ts(name, dictionary):
    lines = [f"export const {name}: Record<string, string> = {{"]
    for k, v in dictionary.items():
        v_escaped = v.replace("\\", "\\\\").replace("'", "\\'")
        lines.append(f"  '{k}': '{v_escaped}',")
    lines.append("};\n")
    with open(f"src/data/locales/{name}.ts", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Saved src/data/locales/{name}.ts ({len(dictionary)} keys)")

save_ts('en', en)
save_ts('es', es)
save_ts('pt', pt)
