import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/auth.store';

const ROLES_ADMIN = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR'] as const;

export default function MainLayout() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario
    ? ROLES_ADMIN.includes(usuario.rol as typeof ROLES_ADMIN[number])
    : false;

  const tabBarStyle = Platform.OS === 'web' ? { display: 'none' as const } : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4e32',
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="reportes/index"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="comunidades/index"
        options={{
          title: 'Comunidades',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alertas/index"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil/index"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/index"
        options={{
          title: 'Admin',
          href: esAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}