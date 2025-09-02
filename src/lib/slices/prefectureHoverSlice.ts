import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PrefectureHoverState {
  hoveredPrefecture: string | null;
  markersOverPrefecture: Set<string>;
}

const initialState: PrefectureHoverState = {
  hoveredPrefecture: null,
  markersOverPrefecture: new Set()
};

export const prefectureHoverSlice = createSlice({
  name: 'prefectureHover',
  initialState,
  reducers: {
    setPrefectureHovered: (state, action: PayloadAction<string | null>) => {
      state.hoveredPrefecture = action.payload;
    },
    addMarkerOverPrefecture: (state, action: PayloadAction<string>) => {
      state.markersOverPrefecture.add(action.payload);
    },
    removeMarkerOverPrefecture: (state, action: PayloadAction<string>) => {
      state.markersOverPrefecture.delete(action.payload);
    }
  }
});

export const { setPrefectureHovered, addMarkerOverPrefecture, removeMarkerOverPrefecture } =
  prefectureHoverSlice.actions;

// Selectors
export const selectHoveredPrefecture = (state: { prefectureHover: PrefectureHoverState }) =>
  state.prefectureHover.hoveredPrefecture;

export const selectMarkersOverPrefecture = (state: { prefectureHover: PrefectureHoverState }) =>
  state.prefectureHover.markersOverPrefecture;

export const selectIsPrefectureHovered = (prefecture: string) => (state: { prefectureHover: PrefectureHoverState }) =>
  state.prefectureHover.hoveredPrefecture === prefecture || state.prefectureHover.markersOverPrefecture.has(prefecture);

export default prefectureHoverSlice.reducer;
