import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  //   withCredentials: true, // trimite cookies la fiecare request
});

export default api;
