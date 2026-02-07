import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getItem, setItem, deleteItem } from '../utils/storage';

// Production API URL (Render deployment)
const PRODUCTION_API_URL = 'https://cayden-bank-api.onrender.com/api';

// Determine the API base URL based on environment
function getApiBaseUrl(): string {
  // Use the configured API URL from app.json extra (production builds)
  const configuredUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configuredUrl) return configuredUrl;

  // If __DEV__ is false, we're in production
  if (!__DEV__) return PRODUCTION_API_URL;

  // Development: use Expo debugger host for physical devices (iPhone)
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (debuggerHost && Platform.OS !== 'web') {
    return `http://${debuggerHost}:3000/api`;
  }

  // Android emulator
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';

  // Web or fallback: use local network IP
  return 'http://192.168.0.241:3000/api';
}

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  refreshQueue = [];
}

// PIN token storage (short-lived, in-memory only)
let _pinToken: string | null = null;
export function setPinToken(token: string | null) {
  _pinToken = token;
}
export function getPinToken(): string | null {
  return _pinToken;
}

// Request interceptor - attach access token and optional PIN token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach PIN token if available
    if (_pinToken) {
      config.headers['x-pin-token'] = _pinToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        await setItem('accessToken', accessToken);
        await setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await deleteItem('accessToken');
        await deleteItem('refreshToken');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
