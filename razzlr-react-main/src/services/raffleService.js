import api from './api';
import { getCookie } from '../utils/cookieUtils';

export const fetchRafflesList = async (params = {}) => {
  try {
    const token = getCookie('access_token');
    const response = await api.get('/raffles-list', {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      params,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const createRaffle = async (raffleData) => {
  try {
    const token = getCookie('access_token');
    const response = await api.post('/create-raffle', raffleData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {    
    throw error;
  }
};

export const fetchRazzleBySlug = async (slug) => {
  console.log('Fetching razzle by slug:', slug);
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/raffle-by-slug',
      { slug },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    // Debug: log slug and API responses    
    console.log('fetchRazzleBySlug response:', response);
    return response;
  } catch (error) {
    throw error;
  }
};

export const fetchRazzleReservationStatus = async (slug) => {
  console.log('Fetching reservation status for slug:', slug);
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/raffle-reservation-status',
      { slug },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    // Debug: log slug and API responses
    console.log('fetchRazzleReservationStatus response:', response);
    return response;
  } catch (error) {
    throw error;
  }
};

export const joinRaffle = async (slug, requestedNumbers) => {
  console.log('Joining raffle with slug:', slug, 'and numbers:', requestedNumbers);
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/join-raffle',
      { 
        slug, 
        requested_numbers: requestedNumbers 
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('joinRaffle response:', response);
    return response;
  } catch (error) {
    console.error('Error joining raffle:', error);
    throw error;
  }
};

export const exitRaffle = async (slug, requestedNumbers) => {
  console.log('Exiting raffle with slug:', slug, 'and numbers:', requestedNumbers);
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/exit-raffle',
      {
        slug,
        requested_numbers: requestedNumbers
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('exitRaffle response:', response);
    return response;
  } catch (error) {
    console.error('Error exiting raffle:', error);
    throw error;
  }
};

export const toggleRaffleLock = async (slug) => {
  console.log('Toggling raffle lock for slug:', slug);
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/toggle-raffle-lock',
      { slug },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('toggleRaffleLock response From Service:', response);
    return response;
  } catch (error) {
    console.error('Error toggling raffle lock:', error);
    throw error;
  }
};

// Add lock/unlock raffle reservations API
export const lockRaffleReservations = async (slug, spots, lock) => {
  console.log('Locking raffle reservations for slug:', slug, 'spots:', spots, 'lock:', lock);
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/lock-raffle-reservations',
      { 
        slug,
        spots,
        lock
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('lockRaffleReservations response From Service:', response);
    return response;
  } catch (error) {
    console.error('Error locking raffle reservations:', error);
    throw error;
  }
};


export const payForRaffle = async (slug) => {
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/pay-for-raffle',
      { slug },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};


export const startRaffleDraw = async (slug) => {
  try {
    const token = getCookie('access_token');
    const response = await api.post(
      '/start-draw',
      { slug },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};