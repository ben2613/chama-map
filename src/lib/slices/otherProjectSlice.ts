import { createSlice } from '@reduxjs/toolkit';

interface OtherProjectState {
  isVisible: boolean;
}

const initialState: OtherProjectState = {
  isVisible: false
};

const otherProjectSlice = createSlice({
  name: 'otherProject',
  initialState,
  reducers: {
    showOtherProject: (state) => {
      state.isVisible = true;
    },
    hideOtherProject: (state) => {
      state.isVisible = false;
    }
  }
});

export const { showOtherProject, hideOtherProject } = otherProjectSlice.actions;

export default otherProjectSlice.reducer;
