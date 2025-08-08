import { useDispatch, useSelector, useStore } from 'react-redux';
import type { RootState, AppDispatch, AppStore } from './store';
import { setLanguage, addLanguage } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

// Custom hook for language management
export const useLanguage = () => {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.language.currentLanguage);
  const availableLanguages = useAppSelector((state) => state.language.availableLanguages);

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
