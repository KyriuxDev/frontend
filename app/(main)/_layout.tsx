import { Tabs } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';

const ROLES_ADMIN = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR'] as const;

export default function MainLayout() {
  const usuario = useAuthStore((s) => s.usuario);

  // Solo ADMIN, SUPER_ADMIN y COORDINADOR ven el tab de administración
  const esAdmin = usuario ? ROLES_ADMIN.includes(usuario.rol as typeof ROLES_ADMIN[number]) : false;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
      }}
    >
      <Tabs.Screen name="reportes/index"    options={{ title: 'Reportes' }} />
      <Tabs.Screen name="comunidades/index" options={{ title: 'Comunidades' }} />
      <Tabs.Screen name="alertas/index"     options={{ title: 'Alertas' }} />
      <Tabs.Screen name="perfil/index"      options={{ title: 'Perfil' }} />

      {/* Tab admin: visible solo para autoridades */}
      <Tabs.Screen
        name="admin/index"
        options={{
          title: 'Admin',
          href: esAdmin ? undefined : null, // null = oculta el tab
          tabBarIcon: ({ color }) => (
            // Si no tienes expo-icons, usa un Text con emoji
            // <Ionicons name="settings-outline" size={24} color={color} />
            null
          ),
        }}
      />
    </Tabs>
  );
}