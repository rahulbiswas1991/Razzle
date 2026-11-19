
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/slice';
import raffleReducer from './raffle/slice';
import userReducer from './user/slice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    raffles: raffleReducer,
    user: userReducer,
  },
});
