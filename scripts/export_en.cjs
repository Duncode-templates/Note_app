const fs = require('fs');
const path = require('path');
const { en } = require('./base_locales.cjs');

fs.writeFileSync(path.join(__dirname, 'en_keys.json'), JSON.stringify(en, null, 2), 'utf8');
console.log('Saved en_keys.json with ' + Object.keys(en).length + ' keys');
