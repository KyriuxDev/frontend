import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/src/store/auth.store';
import { useReportes, useCambiarEstadoReporte } from '@/src/features/reportes/reporte.queries';
import { useComunidades, useActualizarComunidad, useCrearComunidad } from '@/src/features/comunidades/comunidad.queries';
import { ReporteResumen, EstadoReporte } from '@/src/features/reportes/reporte.types';
import { ComunidadResumen } from '@/src/features/comunidades/comunidad.types';
import { formatearFechaCorta } from '@/src/utils/formatDate';

// ─── Tokens de diseño ────────────────────────────────────────────────────────
const C = {
  verde:       '#1d4e32',
  verdeClaro:  '#2d6a45',
  verdePale:   '#f0fdf4',
  verdeMid:    '#dcfce7',
  verdeText:   '#166534',
  amarillo:    '#fef3c7',
  amarilloText:'#92400e',
  azul:        '#dbeafe',
  azulText:    '#1e40af',
  rojo:        '#fee2e2',
  rojoText:    '#991b1b',
  gris:        '#f8fafc',
  grisBorde:   '#e2e8f0',
  grisMid:     '#94a3b8',
  texto:       '#0f172a',
  textoSub:    '#64748b',
  blanco:      '#ffffff',
  bg:          '#f1f5f1',
};

// ─── Helpers de estado ───────────────────────────────────────────────────────
function estadoConfig(estado: EstadoReporte) {
  switch (estado) {
    case 'PENDIENTE':  return { bg: C.amarillo,  text: C.amarilloText, label: 'Pendiente',   dot: '#d97706' };
    case 'EN_PROCESO': return { bg: C.azul,      text: C.azulText,     label: 'En Proceso',  dot: '#3b82f6' };
    case 'RESUELTO':   return { bg: C.verdeMid,  text: C.verdeText,    label: 'Resuelto',    dot: '#16a34a' };
    case 'RECHAZADO':  return { bg: C.rojo,      text: C.rojoText,     label: 'Rechazado',   dot: '#dc2626' };
  }
}

const ESTADOS: EstadoReporte[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'RECHAZADO'];

// ─── Chip de estado ──────────────────────────────────────────────────────────
function ChipEstado({ estado }: { estado: EstadoReporte }) {
  const cfg = estadoConfig(estado);
  return (
    <View style={{
      backgroundColor: cfg.bg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.text }}>{cfg.label}</Text>
    </View>
  );
}

// ─── Tarjeta de stat ─────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: C.blanco,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: C.grisBorde,
      minWidth: 120,
    }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color, marginTop: 8 }}>{value}</Text>
      <Text style={{ fontSize: 12, color: C.textoSub, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Fila de reporte (versión tabla web) ─────────────────────────────────────
function FilaReporte({ reporte }: { reporte: ReporteResumen }) {
  const [expandido, setExpandido] = useState(false);
  const { mutate: cambiarEstado, isPending } = useCambiarEstadoReporte(reporte.id);

  const handleCambio = (nuevoEstado: EstadoReporte) => {
    if (nuevoEstado === reporte.estado) return;
    const cfg = estadoConfig(nuevoEstado);
    Alert.alert(
      'Cambiar estado',
      `¿Cambiar a "${cfg.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => cambiarEstado({ estado: nuevoEstado }) },
      ],
    );
  };

  return (
    <View style={{
      backgroundColor: C.blanco,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: expandido ? C.verde : C.grisBorde,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      {/* Fila principal */}
      <TouchableOpacity
        onPress={() => setExpandido(!expandido)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          gap: 12,
        }}
      >
        {/* Indicador de categoría */}
        <View style={{
          width: 4,
          height: 40,
          borderRadius: 2,
          backgroundColor:
            reporte.categoria === 'INFRAESTRUCTURA' ? '#3b82f6' :
            reporte.categoria === 'VIALIDAD'        ? '#f59e0b' :
            reporte.categoria === 'BLOQUEOS'        ? '#ec4899' : '#22c55e',
        }} />

        {/* Info principal */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.texto }} numberOfLines={1}>
            {reporte.titulo}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 3 }}>
            <Text style={{ fontSize: 12, color: C.textoSub }}>
              📍 {reporte.comunidad.nombre}
            </Text>
            <Text style={{ fontSize: 12, color: C.textoSub }}>
              📅 {formatearFechaCorta(reporte.createdAt)}
            </Text>
            <Text style={{ fontSize: 12, color: C.textoSub }}>
              ⭐ {reporte.gravedad}/5
            </Text>
          </View>
        </View>

        {/* Chip categoría */}
        <View style={{
          backgroundColor: '#f1f5f9',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: C.textoSub }}>
            {reporte.categoria}
          </Text>
        </View>

        {/* Estado */}
        <ChipEstado estado={reporte.estado} />

        {/* Toggle */}
        <Text style={{ color: C.grisMid, fontSize: 14 }}>{expandido ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Panel de acciones expandido */}
      {expandido && (
        <View style={{
          borderTopWidth: 1,
          borderTopColor: C.grisBorde,
          padding: 14,
          backgroundColor: C.gris,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.textoSub, marginBottom: 10, letterSpacing: 0.5 }}>
            CAMBIAR ESTADO
          </Text>
          {isPending ? (
            <ActivityIndicator color={C.verde} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ESTADOS.map((e) => {
                const cfg = estadoConfig(e);
                const activo = e === reporte.estado;
                return (
                  <TouchableOpacity
                    key={e}
                    onPress={() => handleCambio(e)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: activo ? 2 : 1,
                      borderColor: activo ? cfg.dot : C.grisBorde,
                      backgroundColor: activo ? cfg.bg : C.blanco,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? cfg.text : C.textoSub }}>
                      {cfg.label}
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

// ─── Sección de Reportes ─────────────────────────────────────────────────────
function SeccionReportes() {
  const [filtroEstado, setFiltroEstado] = useState<EstadoReporte | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useReportes({ estado: filtroEstado });

  const reportes = data?.data ?? [];
  const total    = data?.meta.total ?? 0;

  // Conteos para stats
  const { data: dataTodos } = useReportes({});
  const todos = dataTodos?.data ?? [];
  const conteos = {
    pendiente:  todos.filter(r => r.estado === 'PENDIENTE').length,
    enProceso:  todos.filter(r => r.estado === 'EN_PROCESO').length,
    resuelto:   todos.filter(r => r.estado === 'RESUELTO').length,
    rechazado:  todos.filter(r => r.estado === 'RECHAZADO').length,
  };

  const FILTROS: { label: string; value: EstadoReporte | undefined }[] = [
    { label: 'Todos', value: undefined },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Resuelto', value: 'RESUELTO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
  ];

  return (
    <View style={{ flex: 1 }}>

      {/* Stats cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Pendientes"  value={conteos.pendiente} color={C.amarilloText} icon="⏳" />
        <StatCard label="En Proceso"  value={conteos.enProceso} color={C.azulText}     icon="🔧" />
        <StatCard label="Resueltos"   value={conteos.resuelto}  color={C.verdeText}    icon="✅" />
        <StatCard label="Rechazados"  value={conteos.rechazado} color={C.rojoText}     icon="❌" />
      </View>

      {/* Filtros */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {FILTROS.map((f) => {
          const activo = filtroEstado === f.value;
          return (
            <TouchableOpacity
              key={String(f.value)}
              onPress={() => setFiltroEstado(f.value)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: activo ? C.verde : C.blanco,
                borderWidth: 1,
                borderColor: activo ? C.verde : C.grisBorde,
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: activo ? C.blanco : C.textoSub,
              }}>
                {f.label}
                {f.value && ` (${conteos[f.value === 'PENDIENTE' ? 'pendiente' : f.value === 'EN_PROCESO' ? 'enProceso' : f.value === 'RESUELTO' ? 'resuelto' : 'rechazado']})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Encabezado de tabla */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: C.gris,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: C.grisBorde,
      }}>
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: C.textoSub, letterSpacing: 0.5 }}>
          REPORTE
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textoSub, letterSpacing: 0.5, marginRight: 80 }}>
          CATEGORÍA
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textoSub, letterSpacing: 0.5, marginRight: 30 }}>
          ESTADO
        </Text>
      </View>

      {/* Lista */}
      {isLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={C.verde} size="large" />
          <Text style={{ color: C.textoSub, marginTop: 12 }}>Cargando reportes...</Text>
        </View>
      )}

      {isError && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={{ color: C.textoSub, marginTop: 8 }}>Error al cargar reportes</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{ marginTop: 12, backgroundColor: C.verde, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: C.blanco, fontWeight: '600' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && reportes.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={{ fontSize: 16, color: C.textoSub, marginTop: 12 }}>
            No hay reportes con este filtro
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {reportes.map((r) => <FilaReporte key={r.id} reporte={r} />)}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sección de Comunidades ──────────────────────────────────────────────────
function SeccionComunidades() {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre]           = useState('');
  const [municipioId, setMunicipioId] = useState('');

  const { data, isLoading }             = useComunidades();
  const { mutate: activar, isPending: activando } = useActualizarComunidad();
  const { mutate: crear,   isPending: creando }   = useCrearComunidad();

  const comunidades = data?.data ?? [];
  const activas     = comunidades.filter(c => c.status === 'ACTIVO').length;
  const pendientes  = comunidades.filter(c => c.status === 'PENDIENTE').length;

  const handleActivar = (com: ComunidadResumen) => {
    Alert.alert('Activar comunidad', `¿Activar "${com.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Activar', onPress: () => activar({ slug: com.slug, dto: { status: 'ACTIVO' } }) },
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
          setNombre(''); setMunicipioId(''); setMostrarForm(false);
          Alert.alert('✅ Creada', 'Comunidad creada en estado PENDIENTE.');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo crear');
        },
      },
    );
  };

  function estadoColor(status: string) {
    switch (status) {
      case 'ACTIVO':     return { bg: C.verdeMid,  text: C.verdeText,    dot: '#16a34a' };
      case 'PENDIENTE':  return { bg: C.amarillo,  text: C.amarilloText, dot: '#d97706' };
      case 'RECHAZADO':  return { bg: C.rojo,      text: C.rojoText,     dot: '#dc2626' };
      case 'SUSPENDIDO': return { bg: '#f1f5f9',   text: '#64748b',      dot: '#94a3b8' };
      default:           return { bg: '#f1f5f9',   text: '#64748b',      dot: '#94a3b8' };
    }
  }

  return (
    <View style={{ flex: 1 }}>

      {/* Stats comunidades */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <StatCard label="Activas"    value={activas}   color={C.verdeText}    icon="🏘️" />
        <StatCard label="Pendientes" value={pendientes} color={C.amarilloText} icon="⏳" />
      </View>

      {/* Botón nueva comunidad */}
      <TouchableOpacity
        onPress={() => setMostrarForm(!mostrarForm)}
        style={{
          backgroundColor: mostrarForm ? '#dc2626' : C.verde,
          borderRadius: 10,
          padding: 14,
          alignItems: 'center',
          marginBottom: 16,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={{ color: C.blanco, fontWeight: '700', fontSize: 15 }}>
          {mostrarForm ? '✕  Cancelar' : '＋  Nueva comunidad'}
        </Text>
      </TouchableOpacity>

      {/* Formulario */}
      {mostrarForm && (
        <View style={{
          backgroundColor: C.blanco,
          borderRadius: 12,
          padding: 20,
          borderWidth: 1,
          borderColor: C.grisBorde,
          marginBottom: 16,
          gap: 12,
        }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.texto }}>
            Nueva Comunidad
          </Text>
          <View style={{ gap: 10 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.textoSub, marginBottom: 6 }}>
                NOMBRE
              </Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Colonia Centro"
                placeholderTextColor={C.grisMid}
                style={{
                  borderWidth: 1,
                  borderColor: C.grisBorde,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 14,
                  color: C.texto,
                  backgroundColor: C.gris,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.textoSub, marginBottom: 6 }}>
                ID MUNICIPIO
              </Text>
              <TextInput
                value={municipioId}
                onChangeText={setMunicipioId}
                placeholder="Número entero"
                placeholderTextColor={C.grisMid}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: C.grisBorde,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 14,
                  color: C.texto,
                  backgroundColor: C.gris,
                }}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCrear}
            disabled={creando}
            style={{
              backgroundColor: creando ? '#86efac' : C.verde,
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
            }}
          >
            {creando
              ? <ActivityIndicator color={C.blanco} />
              : <Text style={{ color: C.blanco, fontWeight: '700' }}>Crear comunidad</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Encabezado tabla */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: C.gris,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: C.grisBorde,
      }}>
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: C.textoSub, letterSpacing: 0.5 }}>
          COMUNIDAD
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textoSub, letterSpacing: 0.5, marginRight: 80 }}>
          IRSU
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textoSub, letterSpacing: 0.5 }}>
          ESTADO
        </Text>
      </View>

      {isLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={C.verde} size="large" />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {comunidades.map((com) => {
          const col = estadoColor(com.status);
          return (
            <View key={com.id} style={{
              backgroundColor: C.blanco,
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: C.grisBorde,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
              {/* Dot IRSU */}
              <View style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  com.irsuActual > 100 ? '#dc2626' :
                  com.irsuActual > 50  ? '#d97706' : '#16a34a',
              }} />

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.texto }}>
                  {com.nombre}
                </Text>
                <Text style={{ fontSize: 12, color: C.textoSub, marginTop: 2 }}>
                  {com.municipio.nombre}
                </Text>
              </View>

              {/* IRSU */}
              <Text style={{
                fontSize: 16,
                fontWeight: '800',
                color:
                  com.irsuActual > 100 ? '#dc2626' :
                  com.irsuActual > 50  ? '#d97706' : '#16a34a',
                minWidth: 60,
                textAlign: 'right',
              }}>
                {com.irsuActual.toFixed(1)}
              </Text>

              {/* Badge estado */}
              <View style={{
                backgroundColor: col.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                minWidth: 90,
                justifyContent: 'center',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: col.dot }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: col.text }}>
                  {com.status}
                </Text>
              </View>

              {/* Botón activar */}
              {com.status === 'PENDIENTE' && (
                <TouchableOpacity
                  onPress={() => handleActivar(com)}
                  disabled={activando}
                  style={{
                    backgroundColor: C.verde,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: C.blanco, fontSize: 12, fontWeight: '700' }}>
                    Activar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Panel Admin Principal ────────────────────────────────────────────────────
type Tab = 'reportes' | 'comunidades';

export function PanelAdmin() {
  const [tabActiva, setTabActiva] = useState<Tab>('reportes');
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, flexDirection: Platform.OS === 'web' ? 'row' : 'column' }}>

      {/* ── Sidebar (solo web) ── */}
      {Platform.OS === 'web' && (
        <View style={{
          width: 240,
          backgroundColor: C.verde,
          paddingTop: 40,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}>
          {/* Logo */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: C.blanco, letterSpacing: -1 }}>
              IRSU
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              Panel Administrativo
            </Text>
          </View>

          {/* Nav items */}
          {([
            { key: 'reportes',    label: 'Reportes',    emoji: '📋' },
            { key: 'comunidades', label: 'Comunidades', emoji: '🏘️' },
          ] as { key: Tab; label: string; emoji: string }[]).map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setTabActiva(item.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                marginBottom: 4,
                backgroundColor: tabActiva === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
              <Text style={{
                fontSize: 14,
                fontWeight: tabActiva === item.key ? '700' : '500',
                color: tabActiva === item.key ? C.blanco : 'rgba(255,255,255,0.65)',
              }}>
                {item.label}
              </Text>
              {tabActiva === item.key && (
                <View style={{
                  marginLeft: 'auto' as any,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: C.blanco,
                }} />
              )}
            </TouchableOpacity>
          ))}

          {/* Info usuario */}
          <View style={{
            marginTop: 'auto' as any,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.2)',
            paddingTop: 16,
          }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.blanco }}>
              {usuario?.nombre ?? usuario?.email}
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              {usuario?.rol}
            </Text>
          </View>
        </View>
      )}

      {/* ── Contenido principal ── */}
      <View style={{ flex: 1, overflow: 'hidden' }}>

        {/* Header (solo móvil) */}
        {Platform.OS !== 'web' && (
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 52,
            paddingBottom: 12,
            backgroundColor: C.verde,
          }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: C.blanco, letterSpacing: -0.5 }}>
              IRSU Admin
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {usuario?.rol} · {usuario?.nombre ?? usuario?.email}
            </Text>
          </View>
        )}

        {/* Header web con título de sección */}
        {Platform.OS === 'web' && (
          <View style={{
            paddingHorizontal: 32,
            paddingVertical: 20,
            backgroundColor: C.blanco,
            borderBottomWidth: 1,
            borderBottomColor: C.grisBorde,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.texto }}>
                {tabActiva === 'reportes' ? 'Gestión de Reportes' : 'Gestión de Comunidades'}
              </Text>
              <Text style={{ fontSize: 13, color: C.textoSub, marginTop: 2 }}>
                {tabActiva === 'reportes'
                  ? 'Revisa, filtra y actualiza el estado de los reportes ciudadanos'
                  : 'Administra y activa comunidades del municipio'}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: C.verdePale,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a' }} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.verdeText }}>
                Sistema activo
              </Text>
            </View>
          </View>
        )}

        {/* Tabs (solo móvil) */}
        {Platform.OS !== 'web' && (
          <View style={{ flexDirection: 'row', backgroundColor: C.blanco, borderBottomWidth: 1, borderBottomColor: C.grisBorde }}>
            {([
              { key: 'reportes',    label: '📋 Reportes' },
              { key: 'comunidades', label: '🏘️ Comunidades' },
            ] as { key: Tab; label: string }[]).map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTabActiva(t.key)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderBottomWidth: tabActiva === t.key ? 2 : 0,
                  borderBottomColor: C.verde,
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: tabActiva === t.key ? '700' : '500',
                  color: tabActiva === t.key ? C.verde : C.textoSub,
                }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Contenido */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: Platform.OS === 'web' ? 32 : 16,
            paddingBottom: 60,
          }}
        >
          {tabActiva === 'reportes'    && <SeccionReportes />}
          {tabActiva === 'comunidades' && <SeccionComunidades />}
        </ScrollView>
      </View>
    </View>
  );
}