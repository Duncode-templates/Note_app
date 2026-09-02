# -*- coding: utf-8 -*-
import json
import os

# We will define comprehensive dictionaries for all 16 languages
# Base English keys
with open('/tmp/make_translations.py', 'r', encoding='utf-8') as f:
    code = f.read()

namespace = {}
exec(code, namespace)
en_dict = namespace['translations']['en']

# Load ES
with open('/tmp/make_all_languages.py', 'r', encoding='utf-8') as f:
    es_code = f.read()
namespace_es = {}
exec(es_code, namespace_es)
es_dict = namespace_es['all_translations']['es']

# Helper to build language dictionary based on key mapping
def make_lang(translations_map):
    res = {}
    for k in en_dict:
        if k in translations_map:
            res[k] = translations_map[k]
        else:
            res[k] = en_dict[k]
    return res

print("Generator helper ready.")
