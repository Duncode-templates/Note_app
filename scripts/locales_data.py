# -*- coding: utf-8 -*-
# High quality localization dictionaries for Free Kick Legends

def get_translations():
    # Load base English keys
    import json
    with open('scripts/en_keys.json', 'r', encoding='utf-8') as f:
        en = json.load(f)

    # Let's import the Spanish dictionary from lang_group1
    from lang_group1 import es
    
    # Fill any missing keys in es with en fallback
    full_es = dict(en)
    full_es.update(es)

    return {
        'en': en,
        'es': full_es
    }

if __name__ == '__main__':
    data = get_translations()
    print(f"Loaded {len(data)} languages")
