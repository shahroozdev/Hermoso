import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { tokenCookies } from '../utils/tokenCookies';

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = tokenCookies.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const refreshToken = tokenCookies.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );
      if (data?.accessToken && data?.refreshToken) {
        tokenCookies.set(data.accessToken, data.refreshToken);
      }
      return api(originalRequest);
    } catch (refreshError) {
      tokenCookies.clear();
      localStorage.removeItem('hermoso_user');
      return Promise.reject(refreshError);
    }
  }
);
