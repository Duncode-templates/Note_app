# -*- coding: utf-8 -*-
import json
import os

# Let's read the current keys in translationsExtra.ts
with open('src/data/translationsExtra.ts', 'r', encoding='utf-8') as f:
    text = f.read()

print("Current size of translationsExtra.ts:", len(text))
