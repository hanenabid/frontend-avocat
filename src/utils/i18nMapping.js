const removeDiacritics = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const specialtyMap = {
  // Français
  'droit civil': 'droitCivil', 'droitcivil': 'droitCivil', 'civil': 'droitCivil',
  'droit penal': 'droitPenal', 'droit pénal': 'droitPenal', 'droitpenal': 'droitPenal', 'penal': 'droitPenal', 'pénal': 'droitPenal',
  'droit commercial': 'droitCommercial', 'droitcommercial': 'droitCommercial', 'commercial': 'droitCommercial',
  'droit du travail': 'droitTravail', 'droit travail': 'droitTravail', 'droittravail': 'droitTravail', 'travail': 'droitTravail',
  'droit fiscal': 'droitFiscal', 'droitfiscal': 'droitFiscal', 'fiscal': 'droitFiscal',
  'droit immobilier': 'droitImmobilier', 'droitimmobilier': 'droitImmobilier', 'immobilier': 'droitImmobilier',

  // Anglais — valeurs exactes stockées en DB (camelCase)
  'familylaw': 'familyLaw', 'family law': 'familyLaw',
  'criminallaw': 'criminalLaw', 'criminal law': 'criminalLaw',
  'corporatelaw': 'corporateLaw', 'corporate law': 'corporateLaw',
  'laborlaw': 'laborLaw', 'labor law': 'laborLaw',
  'taxlaw': 'taxLaw', 'tax law': 'taxLaw',
  'realestatelaw': 'realEstateLaw', 'real estate law': 'realEstateLaw',
  'intellectualproperty': 'intellectualProperty', 'intellectual property': 'intellectualProperty',
  'civillaw': 'civilLaw', 'civil law': 'civilLaw',
  'contractlaw': 'contractLaw', 'contract law': 'contractLaw',
  'immigrationlaw': 'immigrationLaw', 'immigration law': 'immigrationLaw',
  'personalinjury': 'personalInjury', 'personal injury': 'personalInjury',
  'administrativelaw': 'administrativeLaw', 'administrative law': 'administrativeLaw',

  // Variantes
  'business law': 'corporateLaw', 'corporate': 'corporateLaw',
  'employment law': 'laborLaw', 'employment': 'laborLaw',
  'property law': 'realEstateLaw', 'property': 'realEstateLaw',
  'business & corporate law': 'corporateLaw',
  'property & real estate': 'realEstateLaw',
};

const cityMap = {
  'ariana': 'ariana', 'أريانة': 'ariana',
  'beja': 'beja', 'béja': 'beja', 'باجة': 'beja',
  'ben arous': 'benArous', 'بن عروس': 'benArous', 'benarous': 'benArous',
  'bizerte': 'bizerte', 'بنزرت': 'bizerte',
  'gabes': 'gabes', 'قابس': 'gabes',
  'gafsa': 'gafsa', 'قفصة': 'gafsa',
  'jendouba': 'jendouba', 'جندوبة': 'jendouba',
  'kairouan': 'kairouan', 'القيروان': 'kairouan',
  'kasserine': 'kasserine', 'القصرين': 'kasserine',
  'kebili': 'kebili', 'قبلي': 'kebili',
  'kef': 'kef', 'الكاف': 'kef',
  'mahdia': 'mahdia', 'المهدية': 'mahdia',
  'manouba': 'manouba', 'منوبة': 'manouba',
  'medenine': 'medenine', 'مدنين': 'medenine',
  'monastir': 'monastir', 'المنستير': 'monastir',
  'nabeul': 'nabeul', 'نابل': 'nabeul',
  'sfax': 'sfax', 'صفاقس': 'sfax',
  'sidi bouzid': 'sidiBouzid', 'سيدي بوزيد': 'sidiBouzid', 'sidibouzid': 'sidiBouzid',
  'siliana': 'siliana', 'سليانة': 'siliana',
  'sousse': 'sousse', 'سوسة': 'sousse',
  'tataouine': 'tataouine', 'تطاوين': 'tataouine',
  'tozeur': 'tozeur', 'توزر': 'tozeur',
  'tunis': 'tunis', 'تونس': 'tunis',
  'zaghouan': 'zaghouan', 'زغوان': 'zaghouan',
};

export function mapToKey(value, type) {
  if (!value) return '';
  const normalized = removeDiacritics(String(value)).trim();
  if (type === 'specialty') {
    // D'abord chercher dans la map, sinon retourner la valeur normalisée sans espaces
    return specialtyMap[normalized] || specialtyMap[normalized.replace(/\s+/g, '')] || normalized.replace(/\s+/g, '');
  }
  if (type === 'city') {
    return cityMap[normalized] || cityMap[normalized.replace(/\s+/g, '')] || normalized.replace(/\s+/g, '');
  }
  return normalized.replace(/\s+/g, '');
}

export default mapToKey;