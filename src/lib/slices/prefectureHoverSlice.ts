import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PrefectureHoverState {
  hoveredPrefecture: string | null;
  markerOverPrefecture: string | null; // Changed from Set<string> to string | null
}

const initialState: PrefectureHoverState = {
  hoveredPrefecture: null,
  markerOverPrefecture: null
};

export const prefectureHoverSlice = createSlice({
  name: 'prefectureHover',
  initialState,
  reducers: {
    setPrefectureHovered: (state, action: PayloadAction<string | null>) => {
      state.hoveredPrefecture = action.payload;
    },
    setMarkerOverPrefecture: (state, action: PayloadAction<string | null>) => {
      state.markerOverPrefecture = action.payload;
    }
  }
});

export const { setPrefectureHovered, setMarkerOverPrefecture } = prefectureHoverSlice.actions;

// Selectors
export const selectHoveredPrefecture = (state: { prefectureHover: PrefectureHoverState }) =>
  state.prefectureHover.hoveredPrefecture;

export const selectMarkerOverPrefecture = (state: { prefectureHover: PrefectureHoverState }) =>
  state.prefectureHover.markerOverPrefecture;

export const selectIsPrefectureHovered = (prefecture: string) => (state: { prefectureHover: PrefectureHoverState }) =>
  state.prefectureHover.hoveredPrefecture === prefecture || state.prefectureHover.markerOverPrefecture === prefecture;

export default prefectureHoverSlice.reducer;
