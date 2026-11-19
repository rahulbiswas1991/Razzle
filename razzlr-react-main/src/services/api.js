import axios from 'axios';

// Create an axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '', // Set your API base URL in .env
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle success response format
    if (response.data && response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    // If not matching expected format, return as is
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      // HTTP 422: validation errors
      if (status === 422 && data && data.errors) {
        return Promise.reject({
          message: data.message || 'Validation error',
          errors: data.errors,
          status,
        });
      }
      // Other error codes: message only
      return Promise.reject({
        message: data && data.message ? data.message : 'An error occurred',
        status,
      });
    }
    // Network or unknown error
    return Promise.reject({
      message: error.message || 'Network error',
      status: null,
    });
  }
);

export default api;
