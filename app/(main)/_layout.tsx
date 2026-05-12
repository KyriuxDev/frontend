import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/auth.store';

const ROLES_ADMIN     = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR'] as const;
const ROLES_CUADRILLA = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR', 'OPERADOR'] as const;

export default function MainLayout() {
  const usuario = useAuthStore((s) => s.usuario);

  const esAdmin = usuario
    ? ROLES_ADMIN.includes(usuario.rol as typeof ROLES_ADMIN[number])
    : false;

  const puedeCuadrillas = usuario
    ? ROLES_CUADRILLA.includes(usuario.rol as typeof ROLES_CUADRILLA[number])
    : false;

  // Los OPERADOR solo ven la pestaña de cuadrillas
  const esOperador = usuario?.rol === 'OPERADOR';

  const tabBarStyle = Platform.OS === 'web' ? { display: 'none' as const } : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4e32',
        tabBarStyle,
      }}
    >
      {/* Tabs que OPERADOR no ve */}
      <Tabs.Screen
        name="reportes/index"
        options={{
          title: 'Reportes',
          href: esOperador ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="comunidades/index"
        options={{
          title: 'Comunidades',
          href: esOperador ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alertas/index"
        options={{
          title: 'Alertas',
          href: esOperador ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil/index"
        options={{
          title: 'Perfil',
          href: esOperador ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/index"
        options={{
          title: 'Admin',
          href: esAdmin && !esOperador ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Cuadrillas — visible solo para roles con acceso */}
      <Tabs.Screen
        name="cuadrillas/index"
        options={{
          title: 'Cuadrillas',
          href: puedeCuadrillas ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ranking/index"
        options={{
          title: 'Ranking',
          href: esOperador ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Suprimir rutas que no deben aparecer como tabs */}
      <Tabs.Screen name="reportes/[id]"  options={{ href: null }} />
      <Tabs.Screen name="reportes/crear" options={{ href: null }} />
    </Tabs>
  );
}