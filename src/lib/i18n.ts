import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../locales/en.json';
import jaTranslations from '../locales/ja.json';

const resources = {
  en: {
    translation: enTranslations
  },
  ja: {
    translation: jaTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

// Helper function to use translations without hooks
export const t = (key: string, options?: Record<string, unknown>): string => {
  return i18n.t(key, options) as string;
};

// Helper function to change language without hooks
export const changeLanguage = (language: string) => {
  return i18n.changeLanguage(language);
};

// Helper function to get current language
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

export default i18n;
