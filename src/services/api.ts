import axios, { AxiosError } from 'axios';
import { clearSession, getSessionEndMessage, getToken, storeSessionEndMessage } from './session';

// Padrão '/api': em desenvolvimento o Vite encaminha para o backend (vite.config.ts).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const message = getSessionEndMessage(error.response?.status, error.response?.data?.detail, error.config?.url);
    if (message !== null) {
      clearSession();
      storeSessionEndMessage(message);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
