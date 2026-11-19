import { createAsyncThunk } from '@reduxjs/toolkit';
import { getFacebookAppId, loginWithFacebook, getUserProfile } from '../../services/authService';
import { setCookie } from '../../utils/cookieUtils';

export const fetchFacebookAppId = createAsyncThunk(
  'auth/fetchFacebookAppId',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getFacebookAppId();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const loginWithFacebookToken = createAsyncThunk(
  'auth/loginWithFacebookToken',
  async (accessToken, { rejectWithValue }) => {
    try {
      const response = await loginWithFacebook(accessToken);     
      if (response && response.token) {
        setCookie('access_token', response.token, 365);
        return { token: response.token, user: response.user, token_type: response.token_type, expires_at: response.expires_at };
      } else {
        return rejectWithValue('No token found in response');
      }
    } catch (error) {
      // Return a serializable error message only
      return rejectWithValue(error && error.message ? error.message : 'Login failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_,thunkAPI ) => {
    try {
      const response = await getUserProfile();
      return thunkAPI.fulfillWithValue(response);
    } catch (error) {
      console.log("error", error);
      return thunkAPI.rejectWithValue(error?.message || 'Failed to fetch user profile');
    }
  }
);
