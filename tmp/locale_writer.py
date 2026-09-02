# -*- coding: utf-8 -*-
import json
import os

# Helper to save a locale file
def write_locale(lang, dict_data):
    ts_content = f"export const {lang}: Record<string, string> = {json.dumps(dict_data, ensure_ascii=False, indent=2)};\n"
    path = f"src/data/locales/{lang}.ts"
    with open(path, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Wrote {path} with {len(dict_data)} keys")

print("Locale writer helper ready.")
