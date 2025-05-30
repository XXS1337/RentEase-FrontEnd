import axios from 'axios';

// Create a custom Axios instance with predefined configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // The base URL for all API requests, coming from environment variables
  headers: {
    'Content-Type': 'application/json', // Ensure all requests send data in JSON format
  },
  withCredentials: true, // Send cookies with every request (needed for authentication/session)
});

// Set up a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response, // Simply return the response if it's successful
  (error) => {
    // Try to extract the error message from the response (if any)
    const message = error?.response?.data?.message;

    // Define a list of known auth-related error conditions
    const isAuthExpired = error?.response?.status === 401 && (message === 'Token expired!' || message === 'Invalid token!' || message === 'User not found' || message === 'Token is not valid' || message === 'Session expired. Please login again');

    // If the error indicates the session is no longer valid
    if (isAuthExpired) {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; // Remove the authentication token cookie
      alert('Session expired. Please log in again.'); // Inform the user their session expired
      window.location.href = '/login'; // Redirect the user to the login page
    }

    // Re-throw the error so it can be handled in the component if needed
    return Promise.reject(error);
  }
);

// Export the configured Axios instance for reuse in the project
export default api;
