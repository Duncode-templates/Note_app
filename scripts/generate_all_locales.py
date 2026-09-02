# -*- coding: utf-8 -*-
import json
import os
import sys

# Load EN master keys
with open('scripts/en_keys.json', 'r', encoding='utf-8') as f:
    en_keys = json.load(f)

# Import all language groups
from scripts.lang_group1 import es
from scripts.lang_pt_fr import pt, fr
from scripts.lang_de_it import de, it
from scripts.lang_ru_tr import ru, tr
from scripts.lang_pl_nl import pl, nl
from scripts.lang_id_vi import id as id_lang, vi
from scripts.lang_ja_ko import ja, ko
from scripts.lang_ar_zh import ar, zh

languages = {
    'en': en_keys,
    'es': es,
    'pt': pt,
    'fr': fr,
    'de': de,
    'it': it,
    'ru': ru,
    'tr': tr,
    'pl': pl,
    'nl': nl,
    'id': id_lang,
    'vi': vi,
    'ja': ja,
    'ko': ko,
    'ar': ar,
    'zh': zh,
}

# Helper function to write a typescript locale file
def write_ts(lang, data_dict):
    # Merge on top of EN so every single key exists
    merged = dict(en_keys)
    merged.update(data_dict)

    filepath = f'src/data/locales/{lang}.ts'
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"// Master full dictionary for {lang}\n")
        f.write(f"export const {lang}: Record<string, string> = {{\n")
        for k, v in merged.items():
            v_escaped = v.replace('\\', '\\\\').replace("'", "\\'")
            f.write(f"  '{k}': '{v_escaped}',\n")
        f.write("};\n")
    print(f"Generated {filepath} with {len(merged)} keys (custom: {len(data_dict)}).")

# Write all 16 locales
for lang_code, d in languages.items():
    write_ts(lang_code, d)

# Also generate an index.ts that exports all 16 locales
with open('src/data/locales/index.ts', 'w', encoding='utf-8') as f:
    f.write("// Aggregated locales map\n")
    for lang_code in languages.keys():
        f.write(f"import {{ {lang_code} }} from './{lang_code}';\n")
    f.write("\nexport const ALL_LOCALES: Record<string, Record<string, string>> = {\n")
    for lang_code in languages.keys():
        f.write(f"  {lang_code},\n")
    f.write("};\n")

print("Generated src/data/locales/index.ts successfully!")
