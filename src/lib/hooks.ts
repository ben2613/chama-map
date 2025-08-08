import { useDispatch, useSelector, useStore } from 'react-redux';
import type { RootState, AppDispatch, AppStore } from './store';
import { setLanguage, addLanguage } from './store';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

// Custom hook for language management with i18n integration
export const useLanguage = () => {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.language.currentLanguage);
  const availableLanguages = useAppSelector((state) => state.language.availableLanguages);
  const { i18n } = useTranslation();

  // Sync i18n language with Redux state
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const changeLanguage = (newLanguage: string) => {
    dispatch(setLanguage(newLanguage));
  };

  const addNewLanguage = (languageCode: string) => {
    dispatch(addLanguage(languageCode));
  };

  return {
    currentLanguage: language,
    availableLanguages,
    changeLanguage,
    addNewLanguage
  };
};

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
