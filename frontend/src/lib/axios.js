import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Pointing to Laravel API
  headers: {
    'Accept': 'application/json'
  }
});

// Request interceptor to attach the Sanctum token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('storage')); // Trigger context update if needed
    }
    return Promise.reject(error);
  }
);

export default api;
