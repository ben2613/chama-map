import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files directly
import enTranslation from '../../public/locales/en/translation.json';
import jaTranslation from '../../public/locales/ja/translation.json';

const resources = {
  en: {
    translation: enTranslation
  },
  ja: {
    translation: jaTranslation
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false, // Set to false for production
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18n;
