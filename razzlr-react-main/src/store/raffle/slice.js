import { createSlice } from '@reduxjs/toolkit';
import { getRafflesList, joinRazzleSpot, exitRazzleSpot, toggleRaffleLockStatus, lockRaffleReservationsThunk } from './thunks';

const initialState = {
  raffles: [],
  openRaffles: [],
  completedRaffles: [],
  raffleDetails: null,
  raffleReservationStatus: null,
  isLocked: false,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  }
};

const raffleSlice = createSlice({
  name: 'raffles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setIsLocked: (state, action) => {
      state.isLocked = action.payload;
    },
    setRaffleDetails: (state, action) => {
      state.raffleDetails = action.payload;
      // Check if raffle details contain is_locked property
      if (action.payload && typeof action.payload.is_locked === 'boolean') {
        state.isLocked = action.payload.is_locked;
      }
    },
    setRaffleReservationStatus: (state, action) => {
      state.raffleReservationStatus = action.payload;
      // Check if reservation status contains is_locked property
      if (action.payload && typeof action.payload.is_locked === 'boolean') {
        state.isLocked = action.payload.is_locked;
      }
    },
    updateBookedNumbers: (state, action) => {
      if (state.raffleReservationStatus) {
        const existingBookedNumbers = state.raffleReservationStatus.booked_numbers || [];
        const newBookedNumbers = action.payload || [];
        const vacantNumbers = state.raffleReservationStatus.vacant_numbers || [];
        
        // Create a Map to track existing bookings by spot_number for efficient lookup
        const existingBookingsMap = new Map();
        existingBookedNumbers.forEach(booking => {
          existingBookingsMap.set(booking.spot_number, booking);
        });
        
        // Track spot numbers that are being booked
        const newlyBookedSpotNumbers = [];
        
        // Merge new bookings, updating existing ones or adding new ones
        newBookedNumbers.forEach(newBooking => {
          existingBookingsMap.set(newBooking.spot_number, newBooking);
          newlyBookedSpotNumbers.push(newBooking.spot_number);
        });
        
        // Convert back to array
        state.raffleReservationStatus.booked_numbers = Array.from(existingBookingsMap.values());
        
        // Remove newly booked spot numbers from vacant_numbers
        state.raffleReservationStatus.vacant_numbers = vacantNumbers.filter(
          vacantNumber => !newlyBookedSpotNumbers.includes(vacantNumber)
        );
        
        console.log('Redux store merged booked_numbers:', state.raffleReservationStatus.booked_numbers);
        console.log('Redux store updated vacant_numbers:', state.raffleReservationStatus.vacant_numbers);
      }
    },
    releaseBookedNumbers: (state, action) => {
      const { raffle_slug, released_numbers } = action.payload || {};
      
      if (state.raffleReservationStatus && raffle_slug === state.raffleReservationStatus.slug) {
        const currentBookedNumbers = state.raffleReservationStatus.booked_numbers || [];
        const currentVacantNumbers = state.raffleReservationStatus.vacant_numbers || [];
        
        // Remove released numbers from booked_numbers
        state.raffleReservationStatus.booked_numbers = currentBookedNumbers.filter(
          booking => !released_numbers.includes(booking.spot_number)
        );
        
        // Add released numbers to vacant_numbers (avoid duplicates)
        const newVacantNumbers = [...currentVacantNumbers];
        released_numbers.forEach(releasedNumber => {
          if (!newVacantNumbers.includes(releasedNumber)) {
            newVacantNumbers.push(releasedNumber);
          }
        });
        state.raffleReservationStatus.vacant_numbers = newVacantNumbers.sort((a, b) => a - b);
        
        console.log('Redux store released numbers:', released_numbers);
        console.log('Redux store updated booked_numbers:', state.raffleReservationStatus.booked_numbers);
        console.log('Redux store updated vacant_numbers:', state.raffleReservationStatus.vacant_numbers);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRafflesList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRafflesList.fulfilled, (state, action) => {
        state.loading = false;
        const rafflesData = action.payload.raffles;
        state.raffles = rafflesData.data;
        // Defensive: fallback if pagination missing
        state.pagination = rafflesData.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: rafflesData.data?.length || 0
        };
        state.openRaffles = rafflesData.data.filter(
          raffle => raffle.drawn_number === null && raffle.drawn_at === null
        );
        state.completedRaffles = rafflesData.data.filter(
          raffle => raffle.drawn_number !== null || raffle.drawn_at !== null
        );
      })
      .addCase(getRafflesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch raffles';
      })
      // Add booked spot with user info
      .addCase(joinRazzleSpot.fulfilled, (state, action) => {
        if (state.raffleReservationStatus && Array.isArray(state.raffleReservationStatus.booked_numbers)) {
          // Prevent duplicates
          const exists = state.raffleReservationStatus.booked_numbers.some(b => b.spot_number === action.payload.spot_number);
          if (!exists) {
            state.raffleReservationStatus.booked_numbers = [...state.raffleReservationStatus.booked_numbers, action.payload];
          }
        }
      })
      // Remove released spot
      .addCase(exitRazzleSpot.fulfilled, (state, action) => {
        if (state.raffleReservationStatus && Array.isArray(state.raffleReservationStatus.booked_numbers)) {
          state.raffleReservationStatus.booked_numbers = state.raffleReservationStatus.booked_numbers.filter(b => b.spot_number !== action.payload);
        }
      })
      // Toggle lock status
      .addCase(toggleRaffleLockStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleRaffleLockStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isLocked = action.payload.is_locked;
        // Update raffle details if present
        if (state.raffleDetails && state.raffleDetails.slug === action.payload.slug) {
          console.log('Toggle lock status In Slice:', action.payload.is_locked);
          console.log('Current raffleDetails In Slice:', state.raffleDetails.is_locked);
          state.raffleDetails.is_locked = action.payload.is_locked;
          console.log('Updated raffleDetails In Slice:', state.raffleDetails.is_locked);
        }
      })
      .addCase(toggleRaffleLockStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle raffle lock';
      })
      // Lock/unlock raffle reservations (spots)
      .addCase(lockRaffleReservationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(lockRaffleReservationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        // Update locked_numbers in raffleReservationStatus
        if (state.raffleReservationStatus) {
          let lockedNumbers = Array.isArray(state.raffleReservationStatus.locked_numbers)
            ? [...state.raffleReservationStatus.locked_numbers]
            : [];
          const { spots, locked } = action.payload;
          if (Array.isArray(spots)) {
            if (locked) {
              // Add spots to locked_numbers (avoid duplicates)
              lockedNumbers = Array.from(new Set([...lockedNumbers, ...spots]));
            } else {
              // Remove spots from locked_numbers
              lockedNumbers = lockedNumbers.filter(num => !spots.includes(num));
            }
            state.raffleReservationStatus.locked_numbers = lockedNumbers;
            console.log('Updated locked_numbers:', state.raffleReservationStatus.locked_numbers);
          }
        }
      })
      .addCase(lockRaffleReservationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to lock/unlock spots';
      });
  },
});

export const { clearError, setIsLocked, setRaffleDetails, setRaffleReservationStatus, updateBookedNumbers, releaseBookedNumbers } = raffleSlice.actions;
export default raffleSlice.reducer;
