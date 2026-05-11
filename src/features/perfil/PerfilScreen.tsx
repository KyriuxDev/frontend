import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { useReportes } from '@/src/features/reportes/reporte.queries';
import { ReporteResumen, EstadoReporte, Categoria } from '@/src/features/reportes/reporte.types';
import { formatearFechaCorta } from '@/src/utils/formatDate';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIniciales(nombre: string | null, email: string): string {
  if (nombre?.trim()) {
    return nombre.trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email[0].toUpperCase();
}

function labelRol(rol: string): string {
  switch (rol) {
    case 'SUPER_ADMIN':  return 'Super Admin';
    case 'ADMIN':        return 'Administrador';
    case 'COORDINADOR':  return 'Coordinador';
    default:             return 'Ciudadano';
  }
}

function categoriaColor(cat: Categoria): { bg: string; text: string; border: string } {
  switch (cat) {
    case 'INFRAESTRUCTURA': return { bg: '#fef9c3', text: '#854d0e', border: '#eab308' };
    case 'VIALIDAD':        return { bg: '#dbeafe', text: '#1d4ed8', border: '#3b82f6' };
    case 'BLOQUEOS':        return { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' };
    case 'SEGURIDAD':       return { bg: '#dcfce7', text: '#166534', border: '#22c55e' };
  }
}

function estadoLabel(estado: EstadoReporte): { label: string; color: string; dot: string } {
  switch (estado) {
    case 'PENDIENTE':  return { label: 'Pendiente',   color: '#92400e', dot: '#d97706' };
    case 'EN_PROCESO': return { label: 'En Revisión', color: '#1e40af', dot: '#3b82f6' };
    case 'RESUELTO':   return { label: 'Resuelto',    color: '#166534', dot: '#22c55e' };
    case 'RECHAZADO':  return { label: 'Rechazado',   color: '#991b1b', dot: '#ef4444' };
  }
}

function Estrellas({ gravedad }: { gravedad: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 14, color: i <= gravedad ? '#f59e0b' : '#cbd5e1' }}>★</Text>
      ))}
    </View>
  );
}

// ─── Tarjeta de reporte ───────────────────────────────────────────────────────

function CardReportePerfil({ reporte, onPress }: { reporte: ReporteResumen; onPress: () => void }) {
  const cat    = categoriaColor(reporte.categoria);
  const estado = estadoLabel(reporte.estado);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: 4,
        borderLeftColor: cat.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Categoría + Estrellas */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ backgroundColor: cat.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: cat.text }}>{reporte.categoria}</Text>
        </View>
        <Estrellas gravedad={reporte.gravedad} />
      </View>

      {/* Título */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30', marginBottom: 4 }} numberOfLines={1}>
        {reporte.titulo}
      </Text>

      {/* Comunidad */}
      <Text style={{ fontSize: 12, color: '#737686', marginBottom: 8 }} numberOfLines={1}>
        {reporte.comunidad.nombre}
      </Text>

      {/* Fecha + Estado */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{formatearFechaCorta(reporte.createdAt)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: estado.dot }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: estado.color }}>{estado.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export function PerfilScreen() {
  const router  = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const logout  = useAuthStore((s) => s.logout);

  // Trae los reportes del usuario (el backend filtra por usuarioId automáticamente para rol USUARIO)
  const { data, isLoading } = useReportes({ limit: 100 } as any);

  const reportes   = data?.data ?? [];
  const total      = data?.meta.total ?? 0;
  const resueltos  = reportes.filter((r) => r.estado === 'RESUELTO').length;
  const recientes  = reportes.slice(0, 3);

  const iniciales = getIniciales(usuario?.nombre ?? null, usuario?.email ?? '?');

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#1d4e32', letterSpacing: -0.5 }}>IRSU</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }}>

          {/* ── Tarjeta de perfil ── */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
            marginBottom: 16,
          }}>
            {/* Avatar con iniciales */}
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: '#1d4e32',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: '#1d4e32',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <Text style={{ fontSize: 36, fontWeight: '700', color: '#ffffff' }}>{iniciales}</Text>
            </View>

            {/* Nombre */}
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#0b1c30', letterSpacing: -0.4, marginBottom: 4 }}>
              {usuario?.nombre ?? 'Sin nombre'}
            </Text>

            {/* Email */}
            <Text style={{ fontSize: 14, color: '#737686', marginBottom: 14 }}>
              {usuario?.email}
            </Text>

            {/* Badges */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1d4e32' }}>
                  {labelRol(usuario?.rol ?? 'USUARIO')}
                </Text>
              </View>
              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#166534' }}>Verificado</Text>
              </View>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{
              flex: 1,
              backgroundColor: '#f0fdf4',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#c3c6d7',
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#0b1c30' }}>
                {isLoading ? '—' : total}
              </Text>
              <Text style={{ fontSize: 12, color: '#737686', marginTop: 4 }}>Total de reportes</Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: '#dcfce7',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#bbf7d0',
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#0b1c30' }}>
                {isLoading ? '—' : resueltos}
              </Text>
              <Text style={{ fontSize: 12, color: '#737686', marginTop: 4 }}>Resueltos</Text>
            </View>
          </View>

          {/* ── Mis reportes recientes ── */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0b1c30' }}>Mis Reportes</Text>
              <TouchableOpacity onPress={() => router.push('/(main)/reportes')}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1d4e32' }}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {isLoading && <ActivityIndicator color="#1d4e32" style={{ marginTop: 20 }} />}

            {!isLoading && recientes.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 36 }}>📋</Text>
                <Text style={{ fontSize: 14, color: '#737686', marginTop: 8 }}>
                  Aún no tienes reportes
                </Text>
              </View>
            )}

            <View style={{ gap: 12 }}>
              {recientes.map((r) => (
                <CardReportePerfil
                  key={r.id}
                  reporte={r}
                  onPress={() => router.push(`/(main)/reportes/${r.id}`)}
                />
              ))}
            </View>
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              height: 56,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#ba1a1a',
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 18 }}>🚪</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#ba1a1a' }}>Cerrar sesión</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', fontSize: 12, color: '#c3c6d7', marginTop: 16 }}>
            IRSU App v1.0.0
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}