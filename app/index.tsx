import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/store/auth.store';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing  = useAuthStore((s) => s.isInitializing);

  // Mientras init() lee SecureStore / localStorage, no redirigimos nada
  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9ff' }}>
        <ActivityIndicator size="large" color="#1d4e32" />
      </View>
    );
  }

  if (isAuthenticated) return <Redirect href="/(main)/reportes" />;
  return <Redirect href="/auth/login" />;
}