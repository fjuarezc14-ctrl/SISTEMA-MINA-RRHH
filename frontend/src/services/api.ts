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

// Interceptor para manejar tokens expirados o no autorizados (401 / token inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLogin = error.config?.url?.includes('/auth/login');
    const isTokenError =
      status === 401 ||
      (status === 403 && String(error.response?.data?.error || '').toLowerCase().includes('token'));

    if (isTokenError && !isLogin) {
      // Si el token expiró o es inválido, limpiar sesión y notificar
      localStorage.removeItem('vt_token');
      localStorage.removeItem('vt_user');
      window.dispatchEvent(new Event('vt_session_expired'));
    }
    return Promise.reject(error);
  }
);
