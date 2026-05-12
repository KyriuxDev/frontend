// app/index.tsx
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/src/store/auth.store';

const ROLES_ADMIN     = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR'];
const ROLES_OPERADOR  = ['OPERADOR'];

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing  = useAuthStore((s) => s.isInitializing);
  const usuario         = useAuthStore((s) => s.usuario);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9ff' }}>
        <ActivityIndicator size="large" color="#1d4e32" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/auth/login" />;

  // Operadores de cuadrilla van directo a su pantalla
  if (usuario && ROLES_OPERADOR.includes(usuario.rol)) {
    return <Redirect href="/(main)/cuadrillas" />;
  }

  // Admins y coordinadores van al panel
  if (usuario && ROLES_ADMIN.includes(usuario.rol)) {
    return <Redirect href="/(main)/admin" />;
  }

  return <Redirect href="/(main)/reportes" />;
}