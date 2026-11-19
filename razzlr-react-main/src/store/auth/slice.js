import { createSlice } from '@reduxjs/toolkit';
import { getCookie, removeCookie } from '../../utils/cookieUtils';
import { fetchFacebookAppId, loginWithFacebookToken } from './thunks';

const initialState = {
  isAuthenticated: !!getCookie('access_token'),
  accessToken: getCookie('access_token'),
  facebookAppId: null,
  loading: false,
  error: null,
  errorDetails: null,
  facebookAppIdLoading: false,
  facebookAppIdError: null,
  facebookAppIdErrorDetails: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      removeCookie('access_token');
    },
    clearError: (state) => {
      state.error = null;
      state.errorDetails = null;
      state.facebookAppIdError = null;
      state.facebookAppIdErrorDetails = null;
      state.userError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFacebookAppId.pending, (state) => {
        state.facebookAppIdLoading = true;
        state.facebookAppIdError = null;
        state.facebookAppIdErrorDetails = null;
      })
      .addCase(fetchFacebookAppId.fulfilled, (state, action) => {
        state.facebookAppIdLoading = false;
        state.facebookAppId = action.payload.app_id;
      })
      .addCase(fetchFacebookAppId.rejected, (state, action) => {
        state.facebookAppIdLoading = false;
        state.facebookAppIdError = action.payload?.message || 'Failed to fetch Facebook App ID';
        state.facebookAppIdErrorDetails = action.payload?.errors || null;
      })
      .addCase(loginWithFacebookToken.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorDetails = null;
      })
      .addCase(loginWithFacebookToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access_token;
      })
      .addCase(loginWithFacebookToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
        state.errorDetails = action.payload?.errors || null;
      })
      // ...existing code...
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
