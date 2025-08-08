import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import i18n from './i18n';

// Language slice
interface LanguageState {
  currentLanguage: string;
  availableLanguages: string[];
}

const initialState: LanguageState = {
  currentLanguage: 'en',
  availableLanguages: ['en', 'ja']
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      if (state.availableLanguages.includes(action.payload)) {
        state.currentLanguage = action.payload;
        // Change i18n language when Redux state changes
        i18n.changeLanguage(action.payload);
      }
    },
    addLanguage: (state, action: PayloadAction<string>) => {
      if (!state.availableLanguages.includes(action.payload)) {
        state.availableLanguages.push(action.payload);
      }
    }
  }
});

export const { setLanguage, addLanguage } = languageSlice.actions;

export const makeStore = () => {
  return configureStore({
    reducer: {
      language: languageSlice.reducer
    }
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
