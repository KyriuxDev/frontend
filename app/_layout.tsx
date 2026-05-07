import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth.store';

const queryClient = new QueryClient();

function AuthInit({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    // Restaura la sesión desde SecureStore al arrancar la app
    init();
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthInit>
    </QueryClientProvider>
  );
}