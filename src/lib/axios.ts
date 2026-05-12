import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('access_token');
  }
  return SecureStore.getItemAsync('access_token');
}

async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
  } else {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('usuario');
  }
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// Interceptor de request — adjunta el token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response — si llega 401, limpia sesión y manda al login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      router.replace('/auth/login');
    }
    return Promise.reject(error);
  }
);