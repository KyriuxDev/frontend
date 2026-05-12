import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, FlatList, TextInput,
  Alert, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/auth.store';
import { useReportes } from '@/src/features/reportes/reporte.queries';
import { useProfile } from '@/src/hooks/useProfile';
import { useDebounce } from '@/src/hooks/useDebounce';
import { ReporteResumen, EstadoReporte, Categoria } from '@/src/features/reportes/reporte.types';
import { formatearFechaCorta } from '@/src/utils/formatDate';
import { getImageUrl } from '@/src/utils/getImageUrl';
import type { ComunidadUsuario } from '@/src/features/auth/auth.types';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#1D4E32';
const ACCENT  = '#C2410C';

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

function CardReportePerfil({ reporte, onPress }: { reporte: ReporteResumen; onPress: () => void }) {
  const cat    = categoriaColor(reporte.categoria);
  const estado = estadoLabel(reporte.estado);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#fff', borderRadius: 12, padding: 14,
        borderLeftWidth: 4, borderLeftColor: cat.border, marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ backgroundColor: cat.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: cat.text }}>{reporte.categoria}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30', marginBottom: 4 }} numberOfLines={1}>
        {reporte.titulo}
      </Text>
      <Text style={{ fontSize: 12, color: '#737686', marginBottom: 8 }} numberOfLines={1}>
        {reporte.comunidad.nombre}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{formatearFechaCorta(reporte.createdAt)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: estado.dot }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: estado.color }}>{estado.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  avatarUrl, iniciales, size = 96, onPress,
}: {
  avatarUrl?: string | null;
  iniciales: string;
  size?: number;
  onPress?: () => void;
}) {
  const url = getImageUrl(avatarUrl);
  const radius = size / 2;

  const inner = url ? (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: radius }}
      // Si la imagen falla (URL válida pero archivo no encontrado) cae al fallback
      onError={() => {/* no-op; React Native ocultará la imagen rota */}}
    />
  ) : (
    <View style={{
      width: size, height: size, borderRadius: radius,
      backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.375, fontWeight: '700', color: '#fff' }}>{iniciales}</Text>
    </View>
  );

  if (!onPress) return inner;

  return (
    <TouchableOpacity onPress={onPress} style={{ position: 'relative' }}>
      {inner}
      <View style={{
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: ACCENT, borderRadius: 12,
        width: 26, height: 26,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
      }}>
        <Text style={{ color: '#fff', fontSize: 12 }}><Ionicons name="pencil-outline" size={20} color="#737686" /></Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────
export function PerfilScreen() {
  const router     = useRouter();
  const { logout } = useAuthStore();

  const {
    usuario, fetchPerfil, loading,
    agregarComunidad, eliminarComunidad, setPrincipal,
    buscarComunidades, subirAvatar,
  } = useProfile();

  const { data, isLoading } = useReportes({ limit: 100 } as any);
  const reportes  = data?.data ?? [];
  const total     = data?.meta?.total ?? 0;
  const resueltos = reportes.filter((r: ReporteResumen) => r.estado === 'RESUELTO').length;
  const recientes = reportes.slice(0, 3);

  const [reportesAbierto, setReportesAbierto] = useState(false);
  const [modalCP, setModalCP]                 = useState(false);
  const [busquedaCP, setBusquedaCP]           = useState('');
  const [resultadosCP, setResultadosCP]       = useState<any[]>([]);
  const [buscando, setBuscando]               = useState(false);
  const busquedaDebounced                     = useDebounce(busquedaCP, 400);

  const comunidades = usuario?.comunidades ?? [];
  const iniciales   = getIniciales(usuario?.nombre ?? null, usuario?.email ?? '?');

  useEffect(() => { fetchPerfil(); }, []);

  useEffect(() => {
    if (busquedaDebounced.length < 3) { setResultadosCP([]); return; }
    setBuscando(true);
    buscarComunidades(busquedaDebounced)
      .then((data: any) =>
        setResultadosCP(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []))
      )
      .finally(() => setBuscando(false));
  }, [busquedaDebounced]);

  const handleAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar tu foto');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await subirAvatar(result.assets[0].uri);
    }
  };

  const handleAgregarComunidad = async (comunidadId: number) => {
    await agregarComunidad(comunidadId);
    setModalCP(false);
    setBusquedaCP('');
    setResultadosCP([]);
  };

  const handleEliminar = (c: ComunidadUsuario) => {
    if (c.esPrincipal) {
      Alert.alert('No permitido', 'No puedes eliminar tu comunidad principal');
      return;
    }
    Alert.alert('Eliminar', `¿Quitar ${c.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarComunidad(c.comunidadId) },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
        backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
      }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: PRIMARY, letterSpacing: -0.5 }}>IRSU</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPerfil} tintColor={PRIMARY} />}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }}>

          {/* Avatar + info */}
          <View style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 24,
            alignItems: 'center', marginBottom: 16,
          }}>
            <View style={{ marginBottom: 16 }}>
              <Avatar
                avatarUrl={usuario?.avatarUrl}
                iniciales={iniciales}
                size={96}
                onPress={handleAvatar}
              />
            </View>

            <Text style={{ fontSize: 22, fontWeight: '700', color: '#0b1c30', marginBottom: 4 }}>
              {usuario?.nombre ?? 'Sin nombre'}
            </Text>
            <Text style={{ fontSize: 14, color: '#737686', marginBottom: 14 }}>
              {usuario?.email}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#065F46' }}>
                  {labelRol(usuario?.rol ?? 'USUARIO')}
                </Text>
              </View>
              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#166534' }}>Verificado</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: '#EAF3DE', borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#0b1c30' }}>
                {isLoading ? '—' : total}
              </Text>
              <Text style={{ fontSize: 12, color: '#737686', marginTop: 4 }}>Total reportes</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#dcfce7', borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#0b1c30' }}>
                {isLoading ? '—' : resueltos}
              </Text>
              <Text style={{ fontSize: 12, color: '#737686', marginTop: 4 }}>Resueltos</Text>
            </View>
          </View>

          {/* Mis comunidades */}
          <View style={{ marginBottom: 20 }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0b1c30' }}>Mis comunidades</Text>
              <TouchableOpacity
                onPress={() => setModalCP(true)}
                style={{ backgroundColor: ACCENT, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>+ C.P.</Text>
              </TouchableOpacity>
            </View>

            {comunidades.length === 0 ? (
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>
                  Agrega tu código postal para comenzar
                </Text>
              </View>
            ) : (
              comunidades.map((c) => (
                <View key={c.id} style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
                  borderWidth: 1, borderColor: c.esPrincipal ? PRIMARY : '#E5E7EB',
                  flexDirection: 'row', alignItems: 'center',
                }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.color, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{c.nombre}</Text>
                      {c.esPrincipal && (
                        <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 }}>
                          <Text style={{ fontSize: 10, color: '#065F46' }}>Principal</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                      C.P. {c.codigoPostal} · {c.colonia}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#6B7280' }}>
                      IRSU: {c.irsuActual.toFixed(1)}
                    </Text>
                  </View>
                  <View style={{ gap: 4, alignItems: 'flex-end' }}>
                    {!c.esPrincipal && (
                      <TouchableOpacity onPress={() => setPrincipal(c.comunidadId)}>
                        <Text style={{ fontSize: 11, color: PRIMARY }}>Principal</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleEliminar(c)}>
                      <Text style={{ fontSize: 11, color: '#DC2626' }}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Mis reportes colapsable */}
          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setReportesAbierto(!reportesAbierto)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0b1c30' }}>Mis Reportes</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => router.push('/(main)/reportes')}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: PRIMARY }}>Ver todos</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>{reportesAbierto ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {reportesAbierto && (
              <>
                {isLoading && <ActivityIndicator color={PRIMARY} />}
                {!isLoading && recientes.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <Text style={{ fontSize: 14, color: '#737686' }}>Aún no tienes reportes</Text>
                  </View>
                )}
                {recientes.map((r: ReporteResumen) => (
                  <CardReportePerfil
                    key={r.id}
                    reporte={r}
                    onPress={() => router.push(`/(main)/reportes/${r.id}`)}
                  />
                ))}
              </>
            )}
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              height: 56, backgroundColor: '#fff',
              borderWidth: 1, borderColor: '#ba1a1a', borderRadius: 12,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#ba1a1a' }}> Cerrar sesión</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', fontSize: 12, color: '#c3c6d7', marginTop: 16 }}>
            IRSU App v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Modal C.P. */}
      <Modal
        visible={modalCP}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalCP(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#FAFAF9' }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: 16, backgroundColor: '#fff',
            borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Buscar por C.P.</Text>
            <TouchableOpacity onPress={() => { setModalCP(false); setBusquedaCP(''); setResultadosCP([]); }}>
              <Text style={{ fontSize: 15, color: PRIMARY }}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16 }}>
            <TextInput
              value={busquedaCP}
              onChangeText={setBusquedaCP}
              placeholder="Escribe tu C.P. (ej. 68000)"
              keyboardType="numeric"
              maxLength={5}
              style={{
                backgroundColor: '#fff', borderRadius: 10,
                borderWidth: 0.5, borderColor: '#E5E7EB',
                padding: 12, fontSize: 15,
              }}
            />
            {buscando && <ActivityIndicator color={PRIMARY} style={{ marginTop: 16 }} />}
          </View>

          <FlatList
            data={resultadosCP}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={
              busquedaCP.length >= 3 && !buscando
                ? <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                    No se encontraron resultados
                  </Text>
                : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (!item.comunidades || item.comunidades.length === 0) {
                    Alert.alert('Sin comunidad', 'Este C.P. aún no tiene una comunidad activa en IRSU');
                    return;
                  }
                  handleAgregarComunidad(item.comunidades[0].id);
                }}
                style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
                  borderWidth: 0.5, borderColor: '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{item.colonia}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  C.P. {item.codigo} · {item.municipio?.nombre}
                </Text>
                {item.comunidades?.length > 0 ? (
                  <Text style={{ fontSize: 11, color: '#1D4E32', marginTop: 2 }}>
                    ✓ {item.comunidades[0].nombre}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Sin comunidad activa</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}