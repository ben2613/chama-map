import { createSlice } from '@reduxjs/toolkit';

interface GuidelineState {
  isVisible: boolean;
}

const initialState: GuidelineState = {
  isVisible: false
};

const guidelineSlice = createSlice({
  name: 'guideline',
  initialState,
  reducers: {
    showGuideline: (state) => {
      state.isVisible = true;
    },
    hideGuideline: (state) => {
      state.isVisible = false;
    }
  }
});

export const { showGuideline, hideGuideline } = guidelineSlice.actions;

export default guidelineSlice.reducer;
