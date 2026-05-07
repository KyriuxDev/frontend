import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useAuthStore } from '@/src/store/auth.store';
import { useReportes, useCambiarEstadoReporte } from '@/src/features/reportes/reporte.queries';
import { useComunidades, useActualizarComunidad, useCrearComunidad } from '@/src/features/comunidades/comunidad.queries';
import { ReporteResumen, EstadoReporte } from '@/src/features/reportes/reporte.types';
import { ComunidadResumen } from '@/src/features/comunidades/comunidad.types';
import { formatearFechaCorta } from '@/src/utils/formatDate';

// ─── Colores de estado ────────────────────────────────────────────────────────

function colorEstado(estado: EstadoReporte) {
  switch (estado) {
    case 'PENDIENTE':  return { bg: '#fef3c7', text: '#92400e', label: 'PENDIENTE' };
    case 'EN_PROCESO': return { bg: '#dbeafe', text: '#1e40af', label: 'EN PROCESO' };
    case 'RESUELTO':   return { bg: '#dcfce7', text: '#166534', label: 'RESUELTO' };
    case 'RECHAZADO':  return { bg: '#fee2e2', text: '#991b1b', label: 'RECHAZADO' };
  }
}

const ESTADOS_DISPONIBLES: EstadoReporte[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'RECHAZADO'];

// ─── Tarjeta de reporte con selector de estado ────────────────────────────────

function CardReporteAdmin({ reporte }: { reporte: ReporteResumen }) {
  const [expandido, setExpandido] = useState(false);
  const { mutate: cambiarEstado, isPending } = useCambiarEstadoReporte(reporte.id);
  const est = colorEstado(reporte.estado);

  const handleCambio = (nuevoEstado: EstadoReporte) => {
    if (nuevoEstado === reporte.estado) return;
    Alert.alert(
      'Cambiar estado',
      `¿Cambiar a ${colorEstado(nuevoEstado).label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => cambiarEstado({ estado: nuevoEstado }),
        },
      ],
    );
  };

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Cabecera */}
      <TouchableOpacity
        onPress={() => setExpandido(!expandido)}
        style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30' }} numberOfLines={1}>
            {reporte.titulo}
          </Text>
          <Text style={{ fontSize: 12, color: '#737686', marginTop: 2 }}>
            {reporte.comunidad.nombre} · {formatearFechaCorta(reporte.createdAt)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: est.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: est.text }}>{est.label}</Text>
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 16 }}>{expandido ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Panel de cambio de estado */}
      {expandido && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#737686', marginBottom: 8 }}>
            CAMBIAR ESTADO
          </Text>
          {isPending ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ESTADOS_DISPONIBLES.map((e) => {
                const c = colorEstado(e);
                const activo = e === reporte.estado;
                return (
                  <TouchableOpacity
                    key={e}
                    onPress={() => handleCambio(e)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      borderWidth: activo ? 2 : 1,
                      borderColor: activo ? c.text : '#e2e8f0',
                      backgroundColor: activo ? c.bg : '#f8fafc',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? c.text : '#64748b' }}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Sección: Gestión de Reportes ────────────────────────────────────────────

function SeccionReportes() {
  const [filtroEstado, setFiltroEstado] = useState<EstadoReporte | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useReportes({ estado: filtroEstado });

  return (
    <View style={{ flex: 1 }}>
      {/* Filtros rápidos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {([undefined, 'PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'RECHAZADO'] as (EstadoReporte | undefined)[]).map((e) => {
          const activo = filtroEstado === e;
          const label  = e ? colorEstado(e).label : 'TODOS';
          return (
            <TouchableOpacity
              key={String(e)}
              onPress={() => setFiltroEstado(e)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: activo ? '#004ac6' : '#e5eeff',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? '#fff' : '#434655' }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && <ActivityIndicator color="#2563eb" style={{ marginTop: 40 }} />}
      {isError && (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: '#737686' }}>Error al cargar reportes</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 8 }}>
            <Text style={{ color: '#004ac6', fontWeight: '600' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {data?.data.map((r) => <CardReporteAdmin key={r.id} reporte={r} />)}
        {!isLoading && data?.data.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#737686', marginTop: 40 }}>
            No hay reportes con este filtro
          </Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sección: Gestión de Comunidades ─────────────────────────────────────────

function SeccionComunidades() {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre]           = useState('');
  const [municipioId, setMunicipioId] = useState('');

  const { data, isLoading } = useComunidades();
  const { mutate: activar, isPending: activando } = useActualizarComunidad();
  const { mutate: crear, isPending: creando }     = useCrearComunidad();

  const handleActivar = (com: ComunidadResumen) => {
    Alert.alert('Activar comunidad', `¿Activar "${com.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Activar',
        onPress: () => activar({ slug: com.slug, dto: { status: 'ACTIVO' } }),
      },
    ]);
  };

  const handleCrear = () => {
    if (!nombre.trim() || !municipioId.trim()) {
      Alert.alert('Error', 'Nombre y municipioId son obligatorios');
      return;
    }
    crear(
      { nombre: nombre.trim(), municipioId: parseInt(municipioId) },
      {
        onSuccess: () => {
          setNombre('');
          setMunicipioId('');
          setMostrarForm(false);
          Alert.alert('✅ Creada', 'Comunidad creada en estado PENDIENTE. Actívala desde la lista.');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo crear');
        },
      },
    );
  };

  function estadoComunidadColor(status: string) {
    switch (status) {
      case 'ACTIVO':     return { bg: '#dcfce7', text: '#166534' };
      case 'PENDIENTE':  return { bg: '#fef3c7', text: '#92400e' };
      case 'RECHAZADO':  return { bg: '#fee2e2', text: '#991b1b' };
      case 'SUSPENDIDO': return { bg: '#f1f5f9', text: '#64748b' };
      default:           return { bg: '#f1f5f9', text: '#64748b' };
    }
  }

  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>

      {/* Botón nueva comunidad */}
      <TouchableOpacity
        onPress={() => setMostrarForm(!mostrarForm)}
        style={{
          backgroundColor: '#004ac6',
          borderRadius: 10,
          padding: 14,
          alignItems: 'center',
          marginBottom: 12,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
          {mostrarForm ? '✕ Cancelar' : '+ Nueva comunidad'}
        </Text>
      </TouchableOpacity>

      {/* Formulario de creación */}
      {mostrarForm && (
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 16,
          borderWidth: 1,
          borderColor: '#c3c6d7',
          marginBottom: 16,
          gap: 10,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0b1c30' }}>Nueva Comunidad</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre de la comunidad"
            placeholderTextColor="#737686"
            style={{ borderWidth: 1, borderColor: '#c3c6d7', borderRadius: 8,
              padding: 10, fontSize: 15, color: '#0b1c30' }}
          />
          <TextInput
            value={municipioId}
            onChangeText={setMunicipioId}
            placeholder="ID del municipio (número)"
            placeholderTextColor="#737686"
            keyboardType="numeric"
            style={{ borderWidth: 1, borderColor: '#c3c6d7', borderRadius: 8,
              padding: 10, fontSize: 15, color: '#0b1c30' }}
          />
          <TouchableOpacity
            onPress={handleCrear}
            disabled={creando}
            style={{ backgroundColor: creando ? '#b4c5ff' : '#004ac6',
              borderRadius: 8, padding: 12, alignItems: 'center' }}
          >
            {creando
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700' }}>Crear comunidad</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de comunidades */}
      {isLoading && <ActivityIndicator color="#2563eb" />}
      {data?.data.map((com) => {
        const col = estadoComunidadColor(com.status);
        return (
          <View key={com.id} style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 14,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30' }}>{com.nombre}</Text>
              <Text style={{ fontSize: 12, color: '#737686', marginTop: 2 }}>{com.municipio.nombre}</Text>
              <Text style={{ fontSize: 11, color: '#737686' }}>IRSU: {com.irsuActual.toFixed(1)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <View style={{ backgroundColor: col.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: col.text }}>{com.status}</Text>
              </View>
              {com.status === 'PENDIENTE' && (
                <TouchableOpacity
                  onPress={() => handleActivar(com)}
                  disabled={activando}
                  style={{ backgroundColor: '#004ac6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Activar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Panel Admin principal ────────────────────────────────────────────────────

type Tab = 'reportes' | 'comunidades';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'reportes',    label: 'Reportes',    emoji: '📋' },
  { key: 'comunidades', label: 'Comunidades', emoji: '🏘️' },
];

export function PanelAdmin() {
  const [tabActiva, setTabActiva] = useState<Tab>('reportes');
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>

      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
      }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#2563eb', letterSpacing: -0.5 }}>
          IRSU Admin
        </Text>
        <Text style={{ fontSize: 13, color: '#737686', marginTop: 2 }}>
          {usuario?.rol} · {usuario?.nombre ?? usuario?.email}
        </Text>
      </View>

      {/* Tabs internos */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        {TABS.map((t) => {
          const activo = tabActiva === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTabActiva(t.key)}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: 'center',
                borderBottomWidth: activo ? 2 : 0,
                borderBottomColor: '#004ac6',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: activo ? '700' : '500',
                color: activo ? '#004ac6' : '#737686' }}>
                {t.emoji} {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenido */}
      <View style={{ flex: 1, paddingTop: 12 }}>
        {tabActiva === 'reportes'    && <SeccionReportes />}
        {tabActiva === 'comunidades' && <SeccionComunidades />}
      </View>
    </View>
  );
}