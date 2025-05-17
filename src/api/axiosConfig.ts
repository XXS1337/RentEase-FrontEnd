import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message;

    const isAuthExpired = error?.response?.status === 401 && (message === 'Token expired!' || message === 'Invalid token!' || message === 'User not found' || message === 'Token is not valid' || message === 'Session expired. Please login again');

    if (isAuthExpired) {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      alert('Session expired. Please log in again.');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
