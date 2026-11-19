import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchUserProfileApi } from '../../services/userService';

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchUserProfileApi();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
