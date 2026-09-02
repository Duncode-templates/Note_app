# -*- coding: utf-8 -*-
import json
import os

# We will read scripts/base_locales.cjs to get the master English keys
with open('scripts/base_locales.cjs', 'r', encoding='utf-8') as f:
    base_js = f.read()

# Extract the dictionary by finding "const en = {"
start_idx = base_js.find('const en = {')
end_idx = base_js.find('};\n\nfunction writeLocaleFile')
en_json_str = base_js[start_idx + len('const en = '):end_idx + 1]

# Parse JS object into Python dict using Node
with open('/tmp/export_en.js', 'w', encoding='utf-8') as f:
    f.write("""
const { en } = require('./scripts/base_locales.cjs');
const fs = require('fs');
fs.writeFileSync('/tmp/en_keys.json', JSON.stringify(en, null, 2), 'utf8');
console.log('Saved en_keys.json with ' + Object.keys(en).length + ' keys');
""")

os.system('node /tmp/export_en.js')

with open('/tmp/en_keys.json', 'r', encoding='utf-8') as f:
    en_dict = json.load(f)

print(f"Loaded {len(en_dict)} master English keys successfully.")
