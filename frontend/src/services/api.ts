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

// Interceptor para manejar tokens expirados o no autorizados (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Si el token expiró o es inválido, limpiar sesión
      localStorage.removeItem('vt_token');
      localStorage.removeItem('vt_user');
    }
    return Promise.reject(error);
  }
);
