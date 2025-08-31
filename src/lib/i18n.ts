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
    debug: false, // Disable debug for production
    detection: {
      // order and from where user language should be detected
      order: ['navigator', 'localStorage', 'cookie'],
      
      // keys or params to lookup language from
      lookupQuerystring: 'lng',
      lookupCookie: 'i18nextLng',
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      
      // cache user language on
      caches: ['localStorage', 'cookie'],
      excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)
      
      // optional htmlTag with lang attribute, the default is:
      htmlTag: document.documentElement,
      
      // optional set cookie options, reference:[MDN Set-Cookie docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
      cookieOptions: { path: '/', sameSite: 'strict' },
      
      // convert detected language to supported language
      convertDetectedLanguage: (lng: string) => {
        if (lng.startsWith('ja')) {
          return 'ja';
        }
        if (lng.startsWith('en')) {
          return 'en';
        }
        return 'en'; // fallback
      }
    },
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18n;
