import { useTranslation } from 'react-i18next';
import { useLanguage } from './useLanguage';
import { Path } from '@/lib/path.type';
import type * as en from '@/locales/en.json';
import type * as ja from '@/locales/ja.json';

// Custom hook for translations with Redux language state
export const useAppTranslation = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();

  const tt = (key: Path<typeof en> | Path<typeof ja>) => {
    return t(key);
  };

  return {
    t,
    i18n,
    currentLanguage,
    tt
  };
};
