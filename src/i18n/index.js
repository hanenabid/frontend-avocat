import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';
import arTranslation from '../locales/ar/translation.json';
import frTranslation from '../locales/fr/translation.json';
import itTranslation from '../locales/it/translation.json';
import deTranslation from '../locales/de/translation.json';


// the translations
const resources = {
  en: {
    translation: enTranslation
  },
  ar: {
    translation: arTranslation
  },
  fr: {
    translation: frTranslation
  },
  it: {
    translation: itTranslation
  },
  de: {
    translation: deTranslation
  }
};

i18n
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    lng: 'fr', // default language
    fallbackLng: 'ar', // fallback to English

    interpolation: {
      escapeValue: false // react already does escaping
    }
  });

// Ensure the document direction matches the current language (RTL for Arabic)
const applyDirection = (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'; // fr → ltr automatiquement
    // also toggle a class for more granular CSS if needed
    document.documentElement.classList.toggle('lang-ar', lng === 'ar');
    document.documentElement.classList.toggle('lang-en', lng !== 'en');
    document.documentElement.classList.toggle('lang-fr', lng === 'fr');
    document.documentElement.classList.toggle('lang-it', lng === 'it');
    document.documentElement.classList.toggle('lang-de', lng === 'de');

  }
};

applyDirection(i18n.language || 'ar');

// React to future language changes
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
});

export default i18n;
