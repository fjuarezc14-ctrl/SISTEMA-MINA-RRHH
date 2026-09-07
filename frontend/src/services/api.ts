import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// Interceptor para inyectar token JWT si existe en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
