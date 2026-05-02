import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken:     string | null;
  isAuthenticated: boolean;
  login:  (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:     null,
  isAuthenticated: false,

  login: async (accessToken) => {
    await SecureStore.setItemAsync('access_token', accessToken);
    set({ accessToken, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    set({ accessToken: null, isAuthenticated: false });
  },
}));