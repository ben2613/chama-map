import { useTranslation } from 'react-i18next';
import { useLanguage } from './useLanguage';

// Custom hook for translations with Redux language state
export const useAppTranslation = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();

  return {
    t,
    i18n,
    currentLanguage
  };
};
