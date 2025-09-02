import { configureStore } from '@reduxjs/toolkit';
import { prefectureHoverSlice } from './slices/prefectureHoverSlice';

export const makeStore = () => {
  return configureStore({
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false
      }),
    reducer: {
      prefectureHover: prefectureHoverSlice.reducer
    }
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export const store = makeStore();
