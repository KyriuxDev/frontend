import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';

const ROLES_ADMIN = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR'] as const;

export default function MainLayout() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario
    ? ROLES_ADMIN.includes(usuario.rol as typeof ROLES_ADMIN[number])
    : false;

  // En web ocultamos completamente el tab bar — la navegación la maneja el sidebar del admin
  const tabBarStyle = Platform.OS === 'web' ? { display: 'none' as const } : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4e32',
        tabBarStyle,
      }}
    >
      <Tabs.Screen name="reportes/index"    options={{ title: 'Reportes'    }} />
      <Tabs.Screen name="comunidades/index" options={{ title: 'Comunidades' }} />
      <Tabs.Screen name="alertas/index"     options={{ title: 'Alertas'     }} />
      <Tabs.Screen name="perfil/index"      options={{ title: 'Perfil'      }} />
      <Tabs.Screen
        name="admin/index"
        options={{
          title: 'Admin',
          href: esAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}