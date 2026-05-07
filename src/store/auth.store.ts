import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Usuario } from '@/src/features/auth/auth.types';

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

interface AuthState {
  accessToken:     string | null;
  usuario:         Usuario | null;
  isAuthenticated: boolean;
  isInitializing:  boolean;        // ← nuevo
  login:  (accessToken: string, usuario: Usuario) => Promise<void>;
  logout: () => Promise<void>;
  init:   () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:     null,
  usuario:         null,
  isAuthenticated: false,
  isInitializing:  true,           // ← empieza true hasta que init() termine

  login: async (accessToken, usuario) => {
    await storage.set('access_token', accessToken);
    await storage.set('usuario', JSON.stringify(usuario));
    set({ accessToken, usuario, isAuthenticated: true });
  },

  logout: async () => {
    await storage.delete('access_token');
    await storage.delete('usuario');
    set({ accessToken: null, usuario: null, isAuthenticated: false });
  },

  init: async () => {
    try {
      const token   = await storage.get('access_token');
      const rawUser = await storage.get('usuario');
      if (token && rawUser) {
        set({ accessToken: token, usuario: JSON.parse(rawUser), isAuthenticated: true });
      }
    } catch {
      // Si algo falla, continuamos sin sesión
    } finally {
      set({ isInitializing: false });   // ← siempre marca como listo
    }
  },
}));