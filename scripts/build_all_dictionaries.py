# -*- coding: utf-8 -*-
import json
import os

with open('scripts/en_keys.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

print(f"Loaded {len(en)} English keys")
