import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(main)/reportes" />;
  }

  return <Redirect href="/auth/login" />;
}