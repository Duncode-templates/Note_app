export interface Country {
  id: string;
  code: string;
  abbr: string;
  name: string;
  rankPoints: number; // Rating out of 100
  confederation: 'UEFA' | 'CONMEBOL' | 'CAF' | 'CONCACAF' | 'AFC' | 'OFC';
}

export const COUNTRIES_DATA: Country[] = [
  { id: '1', code: 'ar', abbr: 'ARG', name: 'Argentina', rankPoints: 99, confederation: 'CONMEBOL' },
  { id: '2', code: 'fr', abbr: 'FRA', name: 'France', rankPoints: 98, confederation: 'UEFA' },
  { id: '3', code: 'es', abbr: 'ESP', name: 'Spain', rankPoints: 97, confederation: 'UEFA' },
  { id: '4', code: 'gb-eng', abbr: 'ENG', name: 'England', rankPoints: 96, confederation: 'UEFA' },
  { id: '5', code: 'br', abbr: 'BRA', name: 'Brazil', rankPoints: 95, confederation: 'CONMEBOL' },
  { id: '6', code: 'be', abbr: 'BEL', name: 'Belgium', rankPoints: 94, confederation: 'UEFA' },
  { id: '7', code: 'nl', abbr: 'NED', name: 'Netherlands', rankPoints: 93, confederation: 'UEFA' },
  { id: '8', code: 'pt', abbr: 'POR', name: 'Portugal', rankPoints: 92, confederation: 'UEFA' },
  { id: '9', code: 'co', abbr: 'COL', name: 'Colombia', rankPoints: 92, confederation: 'CONMEBOL' },
  { id: '10', code: 'it', abbr: 'ITA', name: 'Italy', rankPoints: 91, confederation: 'UEFA' },
  { id: '11', code: 'uy', abbr: 'URU', name: 'Uruguay', rankPoints: 90, confederation: 'CONMEBOL' },
  { id: '12', code: 'hr', abbr: 'CRO', name: 'Croatia', rankPoints: 90, confederation: 'UEFA' },
  { id: '13', code: 'de', abbr: 'GER', name: 'Germany', rankPoints: 89, confederation: 'UEFA' },
  { id: '14', code: 'ma', abbr: 'MAR', name: 'Morocco', rankPoints: 88, confederation: 'CAF' },
  { id: '15', code: 'ch', abbr: 'SUI', name: 'Switzerland', rankPoints: 88, confederation: 'UEFA' },
  { id: '16', code: 'us', abbr: 'USA', name: 'United States', rankPoints: 87, confederation: 'CONCACAF' },
  { id: '17', code: 'mx', abbr: 'MEX', name: 'Mexico', rankPoints: 87, confederation: 'CONCACAF' },
  { id: '18', code: 'jp', abbr: 'JPN', name: 'Japan', rankPoints: 86, confederation: 'AFC' },
  { id: '19', code: 'sn', abbr: 'SEN', name: 'Senegal', rankPoints: 85, confederation: 'CAF' },
  { id: '20', code: 'ir', abbr: 'IRN', name: 'Iran', rankPoints: 85, confederation: 'AFC' },
  { id: '21', code: 'dk', abbr: 'DEN', name: 'Denmark', rankPoints: 84, confederation: 'UEFA' },
  { id: '22', code: 'kr', abbr: 'KOR', name: 'South Korea', rankPoints: 84, confederation: 'AFC' },
  { id: '23', code: 'at', abbr: 'AUT', name: 'Austria', rankPoints: 83, confederation: 'UEFA' },
  { id: '24', code: 'ua', abbr: 'UKR', name: 'Ukraine', rankPoints: 83, confederation: 'UEFA' },
  { id: '25', code: 'au', abbr: 'AUS', name: 'Australia', rankPoints: 82, confederation: 'AFC' },
  { id: '26', code: 'se', abbr: 'SWE', name: 'Sweden', rankPoints: 82, confederation: 'UEFA' },
  { id: '27', code: 'tr', abbr: 'TUR', name: 'Turkey', rankPoints: 81, confederation: 'UEFA' },
  { id: '28', code: 'ec', abbr: 'ECU', name: 'Ecuador', rankPoints: 81, confederation: 'CONMEBOL' },
  { id: '29', code: 'pl', abbr: 'POL', name: 'Poland', rankPoints: 80, confederation: 'UEFA' },
  { id: '30', code: 'ng', abbr: 'NGA', name: 'Nigeria', rankPoints: 80, confederation: 'CAF' },
  { id: '31', code: 'hu', abbr: 'HUN', name: 'Hungary', rankPoints: 79, confederation: 'UEFA' },
  { id: '32', code: 'gb-wls', abbr: 'WAL', name: 'Wales', rankPoints: 79, confederation: 'UEFA' },
  { id: '33', code: 'dz', abbr: 'ALG', name: 'Algeria', rankPoints: 78, confederation: 'CAF' },
  { id: '34', code: 'eg', abbr: 'EGY', name: 'Egypt', rankPoints: 78, confederation: 'CAF' },
  { id: '35', code: 'sr', abbr: 'SRB', name: 'Serbia', rankPoints: 77, confederation: 'UEFA' },
  { id: '36', code: 'ci', abbr: 'CIV', name: 'Ivory Coast', rankPoints: 77, confederation: 'CAF' },
  { id: '37', code: 'ru', abbr: 'RUS', name: 'Russia', rankPoints: 76, confederation: 'UEFA' },
  { id: '38', code: 'cz', abbr: 'CZE', name: 'Czech Republic', rankPoints: 76, confederation: 'UEFA' },
  { id: '39', code: 'tn', abbr: 'TUN', name: 'Tunisia', rankPoints: 75, confederation: 'CAF' },
  { id: '40', code: 'pe', abbr: 'PER', name: 'Peru', rankPoints: 75, confederation: 'CONMEBOL' },
  { id: '41', code: 'cl', abbr: 'CHI', name: 'Chile', rankPoints: 74, confederation: 'CONMEBOL' },
  { id: '42', code: 'sk', abbr: 'SVK', name: 'Slovakia', rankPoints: 74, confederation: 'UEFA' },
  { id: '43', code: 'ro', abbr: 'ROU', name: 'Romania', rankPoints: 73, confederation: 'UEFA' },
  { id: '44', code: 'cm', abbr: 'CMR', name: 'Cameroon', rankPoints: 73, confederation: 'CAF' },
  { id: '45', code: 'ml', abbr: 'MLI', name: 'Mali', rankPoints: 72, confederation: 'CAF' },
  { id: '46', code: 'qa', abbr: 'QAT', name: 'Qatar', rankPoints: 72, confederation: 'AFC' },
  { id: '47', code: 'ca', abbr: 'CAN', name: 'Canada', rankPoints: 71, confederation: 'CONCACAF' },
  { id: '48', code: 'gr', abbr: 'GRE', name: 'Greece', rankPoints: 71, confederation: 'UEFA' },
  { id: '49', code: 've', abbr: 'VEN', name: 'Venezuela', rankPoints: 70, confederation: 'CONMEBOL' },
  { id: '50', code: 'cr', abbr: 'CRC', name: 'Costa Rica', rankPoints: 70, confederation: 'CONCACAF' },
  { id: '51', code: 'no', abbr: 'NOR', name: 'Norway', rankPoints: 69, confederation: 'UEFA' },
  { id: '52', code: 'gb-sct', abbr: 'SCO', name: 'Scotland', rankPoints: 69, confederation: 'UEFA' },
  { id: '53', code: 'sa', abbr: 'KSA', name: 'Saudi Arabia', rankPoints: 68, confederation: 'AFC' },
  { id: '54', code: 'py', abbr: 'PAR', name: 'Paraguay', rankPoints: 68, confederation: 'CONMEBOL' },
  { id: '55', code: 'si', abbr: 'SVN', name: 'Slovenia', rankPoints: 67, confederation: 'UEFA' },
  { id: '56', code: 'gh', abbr: 'GHA', name: 'Ghana', rankPoints: 67, confederation: 'CAF' },
  { id: '57', code: 'ie', abbr: 'IRL', name: 'Republic of Ireland', rankPoints: 66, confederation: 'UEFA' },
  { id: '58', code: 'za', abbr: 'RSA', name: 'South Africa', rankPoints: 66, confederation: 'CAF' },
  { id: '59', code: 'uz', abbr: 'UZB', name: 'Uzbekistan', rankPoints: 65, confederation: 'AFC' },
  { id: '60', code: 'iq', abbr: 'IRQ', name: 'Iraq', rankPoints: 65, confederation: 'AFC' },
  { id: '61', code: 'al', abbr: 'ALB', name: 'Albania', rankPoints: 64, confederation: 'UEFA' },
  { id: '62', code: 'bf', abbr: 'BFA', name: 'Burkina Faso', rankPoints: 64, confederation: 'CAF' },
  { id: '63', code: 'cd', abbr: 'COD', name: 'DR Congo', rankPoints: 63, confederation: 'CAF' },
  { id: '64', code: 'fi', abbr: 'FIN', name: 'Finland', rankPoints: 63, confederation: 'UEFA' },
  { id: '65', code: 'ae', abbr: 'UAE', name: 'United Arab Emirates', rankPoints: 62, confederation: 'AFC' },
  { id: '66', code: 'is', abbr: 'ISL', name: 'Iceland', rankPoints: 62, confederation: 'UEFA' },
  { id: '67', code: 'mk', abbr: 'MKD', name: 'North Macedonia', rankPoints: 61, confederation: 'UEFA' },
  { id: '68', code: 'ge', abbr: 'GEO', name: 'Georgia', rankPoints: 61, confederation: 'UEFA' },
  { id: '69', code: 'ba', abbr: 'BIH', name: 'Bosnia & Herzegovina', rankPoints: 60, confederation: 'UEFA' },
  { id: '70', code: 'me', abbr: 'MNE', name: 'Montenegro', rankPoints: 60, confederation: 'UEFA' },
  { id: '71', code: 'cv', abbr: 'CPV', name: 'Cape Verde', rankPoints: 59, confederation: 'CAF' },
  { id: '72', code: 'gb-nir', abbr: 'NIR', name: 'Northern Ireland', rankPoints: 59, confederation: 'UEFA' },
  { id: '73', code: 'il', abbr: 'ISR', name: 'Israel', rankPoints: 58, confederation: 'UEFA' },
  { id: '74', code: 'gn', abbr: 'GUI', name: 'Guinea', rankPoints: 58, confederation: 'CAF' },
  { id: '75', code: 'bo', abbr: 'BOL', name: 'Bolivia', rankPoints: 57, confederation: 'CONMEBOL' },
  { id: '76', code: 'om', abbr: 'OMA', name: 'Oman', rankPoints: 57, confederation: 'AFC' },
  { id: '77', code: 'jo', abbr: 'JOR', name: 'Jordan', rankPoints: 56, confederation: 'AFC' },
  { id: '78', code: 'hn', abbr: 'HON', name: 'Honduras', rankPoints: 56, confederation: 'CONCACAF' },
  { id: '79', code: 'sv', abbr: 'SLV', name: 'El Salvador', rankPoints: 55, confederation: 'CONCACAF' },
  { id: '80', code: 'jm', abbr: 'JAM', name: 'Jamaica', rankPoints: 55, confederation: 'CONCACAF' },
  { id: '81', code: 'bg', abbr: 'BUL', name: 'Bulgaria', rankPoints: 54, confederation: 'UEFA' },
  { id: '82', code: 'lu', abbr: 'LUX', name: 'Luxembourg', rankPoints: 54, confederation: 'UEFA' },
  { id: '83', code: 'bh', abbr: 'BHR', name: 'Bahrain', rankPoints: 53, confederation: 'AFC' },
  { id: '84', code: 'gq', abbr: 'EQG', name: 'Equatorial Guinea', rankPoints: 53, confederation: 'CAF' },
  { id: '85', code: 'ga', abbr: 'GAB', name: 'Gabon', rankPoints: 52, confederation: 'CAF' },
  { id: '86', code: 'cn', abbr: 'CHN', name: 'China', rankPoints: 52, confederation: 'AFC' },
  { id: '87', code: 'sy', abbr: 'SYR', name: 'Syria', rankPoints: 51, confederation: 'AFC' },
  { id: '88', code: 'zm', abbr: 'ZAM', name: 'Zambia', rankPoints: 51, confederation: 'CAF' },
  { id: '89', code: 'ht', abbr: 'HAI', name: 'Haiti', rankPoints: 50, confederation: 'CONCACAF' },
  { id: '90', code: 'cur', abbr: 'CUW', name: 'Curaçao', rankPoints: 50, confederation: 'CONCACAF' },
  { id: '91', code: 'ug', abbr: 'UGA', name: 'Uganda', rankPoints: 49, confederation: 'CAF' },
  { id: '92', code: 'nz', abbr: 'NZL', name: 'New Zealand', rankPoints: 49, confederation: 'OFC' },
  { id: '93', code: 'am', abbr: 'ARM', name: 'Armenia', rankPoints: 48, confederation: 'UEFA' },
  { id: '94', code: 'bj', abbr: 'BEN', name: 'Benin', rankPoints: 48, confederation: 'CAF' },
  { id: '95', code: 'by', abbr: 'BLR', name: 'Belarus', rankPoints: 47, confederation: 'UEFA' },
  { id: '96', code: 'tt', abbr: 'TRI', name: 'Trinidad & Tobago', rankPoints: 47, confederation: 'CONCACAF' },
  { id: '97', code: 'ps', abbr: 'PLE', name: 'Palestine', rankPoints: 46, confederation: 'AFC' },
  { id: '98', code: 'kg', abbr: 'KGZ', name: 'Kyrgyzstan', rankPoints: 46, confederation: 'AFC' },
  { id: '99', code: 'vn', abbr: 'VIE', name: 'Vietnam', rankPoints: 45, confederation: 'AFC' },
  { id: '100', code: 'th', abbr: 'THA', name: 'Thailand', rankPoints: 45, confederation: 'AFC' },
  { id: '101', code: 'kz', abbr: 'KAZ', name: 'Kazakhstan', rankPoints: 44, confederation: 'UEFA' },
  { id: '102', code: 'in', abbr: 'IND', name: 'India', rankPoints: 44, confederation: 'AFC' },
  { id: '103', code: 'tj', abbr: 'TJK', name: 'Tajikistan', rankPoints: 43, confederation: 'AFC' },
  { id: '104', code: 'lb', abbr: 'LBN', name: 'Lebanon', rankPoints: 43, confederation: 'AFC' },
  { id: '105', code: 'ke', abbr: 'KEN', name: 'Kenya', rankPoints: 42, confederation: 'CAF' },
  { id: '106', code: 'mz', abbr: 'MOZ', name: 'Mozambique', rankPoints: 42, confederation: 'CAF' },
  { id: '107', code: 'mg', abbr: 'MAD', name: 'Madagascar', rankPoints: 41, confederation: 'CAF' },
  { id: '108', code: 'cg', abbr: 'CGO', name: 'Congo', rankPoints: 41, confederation: 'CAF' },
  { id: '109', code: 'id', abbr: 'IDN', name: 'Indonesia', rankPoints: 40, confederation: 'AFC' },
  { id: '110', code: 'az', abbr: 'AZE', name: 'Azerbaijan', rankPoints: 40, confederation: 'UEFA' },
  { id: '111', code: 'ee', abbr: 'EST', name: 'Estonia', rankPoints: 39, confederation: 'UEFA' },
  { id: '112', code: 'cy', abbr: 'CYP', name: 'Cyprus', rankPoints: 39, confederation: 'UEFA' },
  { id: '113', code: 'mw', abbr: 'MWI', name: 'Malawi', rankPoints: 38, confederation: 'CAF' },
  { id: '114', code: 'zw', abbr: 'ZIM', name: 'Zimbabwe', rankPoints: 38, confederation: 'CAF' },
  { id: '115', code: 'to', abbr: 'TOG', name: 'Togo', rankPoints: 37, confederation: 'CAF' },
  { id: '116', code: 'my', abbr: 'MAS', name: 'Malaysia', rankPoints: 37, confederation: 'AFC' },
  { id: '117', code: 'lr', abbr: 'LBR', name: 'Liberia', rankPoints: 36, confederation: 'CAF' },
  { id: '118', code: 'lt', abbr: 'LTU', name: 'Lithuania', rankPoints: 36, confederation: 'UEFA' },
  { id: '119', code: 'sl', abbr: 'SLE', name: 'Sierra Leone', rankPoints: 35, confederation: 'CAF' },
  { id: '120', code: 'fji', abbr: 'FIJ', name: 'Fiji', rankPoints: 35, confederation: 'OFC' },
];

export function getFlagUrl(code: string): string {
  const lower = code.toLowerCase();
  if (lower === 'gb-eng') return 'https://flagcdn.com/w160/gb-eng.png';
  if (lower === 'gb-sct') return 'https://flagcdn.com/w160/gb-sct.png';
  if (lower === 'gb-wls') return 'https://flagcdn.com/w160/gb-wls.png';
  if (lower === 'gb-nir') return 'https://flagcdn.com/w160/gb-nir.png';
  if (lower === 'cur') return 'https://flagcdn.com/w160/cw.png';
  if (lower === 'fji') return 'https://flagcdn.com/w160/fj.png';
  return `https://flagcdn.com/w160/${lower}.png`;
}

export function getCountryAbbr(codeOrCountry: string | Country | undefined | null): string {
  if (!codeOrCountry) return '';
  if (typeof codeOrCountry === 'object') {
    if (codeOrCountry.abbr) return codeOrCountry.abbr.toUpperCase();
    if (codeOrCountry.code) return getCountryAbbr(codeOrCountry.code);
  }
  if (typeof codeOrCountry === 'string') {
    const clean = codeOrCountry.trim().toLowerCase();
    const match = COUNTRIES_DATA.find(
      (c) => c.code.toLowerCase() === clean || c.id === clean || c.name.toLowerCase() === clean
    );
    if (match && match.abbr) return match.abbr.toUpperCase();
    return codeOrCountry.toUpperCase();
  }
  return '';
}

export function getCountryByCode(codeOrId: string | null | undefined): Country | undefined {
  if (!codeOrId) return undefined;
  const clean = codeOrId.trim().toLowerCase();
  return COUNTRIES_DATA.find(
    (c) => c.code.toLowerCase() === clean || c.id.toLowerCase() === clean || c.abbr.toLowerCase() === clean || c.name.toLowerCase() === clean
  );
}


