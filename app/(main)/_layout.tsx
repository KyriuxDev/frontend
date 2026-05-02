import { Tabs } from 'expo-router';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle:      { backgroundColor: '#2563eb' },
        headerTintColor:  '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#2563eb',
      }}
    >
      <Tabs.Screen
        name="reportes/index"
        options={{ title: 'Reportes' }}
      />
      <Tabs.Screen
        name="comunidades/index"
        options={{ title: 'Comunidades' }}
      />
      <Tabs.Screen
        name="alertas/index"
        options={{ title: 'Alertas' }}
      />
      <Tabs.Screen
        name="perfil/index"
        options={{ title: 'Perfil' }}
      />
    </Tabs>
  );
}