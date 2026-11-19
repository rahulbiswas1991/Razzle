import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchRafflesList, fetchRazzleBySlug, fetchRazzleReservationStatus, joinRaffle, exitRaffle, toggleRaffleLock, lockRaffleReservations } from '../../services/raffleService';

// Join a spot in a razzle and update booked_numbers with user info
export const joinRazzleSpot = createAsyncThunk(
  'raffles/joinRazzleSpot',
  async ({ slug, spotNumber, user }, { rejectWithValue }) => {
    try {
      const apiResponse = await joinRaffle(slug, [spotNumber]);
      const response = apiResponse ? apiResponse : apiResponse;
      console.log('joinRazzleSpot thunk:', response);
      // If the API returns the full Axios response, use .data, else use as is
      const reservedArr = response.reserved;
      if (Array.isArray(reservedArr) && reservedArr.includes(spotNumber)) {
        // Add user info to the booked spot
        return {
          spot_number: spotNumber,
          user_slug: user.user_slug,
          user_name: user.name,
          user_avatar: user.avatar
        };
      } else {
        return rejectWithValue(response.message || 'Failed to reserve spot');
      }
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to reserve spot');
    }
  }
);

// Exit (release) a spot in a razzle and update booked_numbers
export const exitRazzleSpot = createAsyncThunk(
  'raffles/exitRazzleSpot',
  async ({ slug, spotNumber }, { rejectWithValue }) => {
    try {
      const apiResponse = await exitRaffle(slug, [spotNumber]);
      const response = apiResponse ? apiResponse : apiResponse;
      const releasedArr = response.released_numbers;
      if (Array.isArray(releasedArr) && releasedArr.includes(spotNumber)) {
        return spotNumber;
      } else {
        return rejectWithValue(response.message || 'Failed to release spot');
      }
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to release spot');
    }
  }
);
import { setRaffleDetails, setRaffleReservationStatus, setIsLocked } from './slice';

export const getRaffleDetails = createAsyncThunk(
  'raffles/getRaffleDetails',
  async (slug, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetchRazzleBySlug(slug);
      const razzle = response && response.raffle ? response.raffle : null;
      dispatch(setRaffleDetails(razzle));
      return razzle;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch raffle details');
    }
  }
);

export const getRaffleReservationStatus = createAsyncThunk(
  'raffles/getRaffleReservationStatus',
  async (slug, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetchRazzleReservationStatus(slug);
      dispatch(setRaffleReservationStatus(response));
      return response;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch reservation status');
    }
  }
);

export const getRafflesList = createAsyncThunk(
  'raffles/getRafflesList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchRafflesList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch raffles');
    }
  }
);

export const toggleRaffleLockStatus = createAsyncThunk(
  'raffles/toggleRaffleLockStatus',
  async (slug, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await toggleRaffleLock(slug);
      const data = response
      
      // Update the raffle details with new lock status
      dispatch(setIsLocked(data.is_locked));
      
      // Also update the raffle details if available      
      const currentState = getState();
      console.log('currentState In Thunk:', currentState);     
      
      return data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to toggle raffle lock');
    }
  }
);

// Lock/unlock raffle reservations (spots)
export const lockRaffleReservationsThunk = createAsyncThunk(
  'raffles/lockRaffleReservations',
  async ({ slug, spots, lock }, { dispatch, rejectWithValue }) => {
    try {
      const response = await lockRaffleReservations(slug, spots, lock);
      
      return {
        slug,
        spots: response.spots,
        locked: response.locked,
        updated_count: response.updated_count
      };
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to lock/unlock spots');
    }
  }
);
