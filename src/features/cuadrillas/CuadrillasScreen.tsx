import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAsignaciones, useCambiarEstadoAsignacion, EstadoAsignacion } from './cuadrilla.queries';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  verde:      '#1d4e32',
  verdeLight: '#edf7f0',
  verdeMid:   '#dcfce7',
  verdeText:  '#166534',
  verdeBorde: '#b8e0c5',
  bg:         '#f4f6f4',
  blanco:     '#ffffff',
  borde:      '#e8ede8',
  texto:      '#0f1f0f',
  textoSub:   '#4a5e4a',
  textoMuted: '#9aaa9a',
  amber:      '#fef3c7',
  amberText:  '#92400e',
  amberDot:   '#d97706',
  azul:       '#dbeafe',
  azulText:   '#1e40af',
  azulDot:    '#3b82f6',
  rojo:       '#fee2e2',
  rojoText:   '#991b1b',
  rojoDot:    '#dc2626',
};

type FiltroEstado = EstadoAsignacion | 'TODAS';

const FILTROS: { label: string; value: FiltroEstado; icon: string }[] = [
  { label: 'Todas',      value: 'TODAS',      icon: 'apps-outline' },
  { label: 'Asignadas',  value: 'ASIGNADA',   icon: 'clipboard-outline' },
  { label: 'En curso',   value: 'EN_CURSO',   icon: 'construct-outline' },
  { label: 'Listas',     value: 'COMPLETADA', icon: 'checkmark-circle-outline' },
];

function estadoCfg(estado: EstadoAsignacion) {
  switch (estado) {
    case 'ASIGNADA':   return { bg: C.amber,    text: C.amberText,  dot: C.amberDot,  label: 'Asignada'  };
    case 'EN_CURSO':   return { bg: C.azul,     text: C.azulText,   dot: C.azulDot,   label: 'En curso'  };
    case 'COMPLETADA': return { bg: C.verdeMid, text: C.verdeText,  dot: '#16a34a',   label: 'Completada'};
    case 'CANCELADA':  return { bg: C.rojo,     text: C.rojoText,   dot: C.rojoDot,   label: 'Cancelada' };
  }
}

function gravedadColor(n: number) {
  if (n >= 4) return C.rojoDot;
  if (n >= 3) return C.amberDot;
  return '#16a34a';
}

// ─── Tarjeta de asignación ────────────────────────────────────────────────────
function TarjetaAsignacion({ asignacion }: { asignacion: any }) {
  const { mutate, isPending } = useCambiarEstadoAsignacion();
  const [expandida, setExpandida] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const estado: EstadoAsignacion = asignacion.estado;
  const s = estadoCfg(estado);
  const finalizado = estado === 'COMPLETADA' || estado === 'CANCELADA';

  function toggle() {
    if (!expandida) {
      setExpandida(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
        setExpandida(false)
      );
    }
  }

  function confirmarCambio(nuevoEstado: EstadoAsignacion, etiqueta: string) {
    Alert.alert(
      etiqueta,
      nuevoEstado === 'COMPLETADA'
        ? '¿Confirmas que el trabajo está terminado? El reporte quedará como RESUELTO.'
        : nuevoEstado === 'EN_CURSO'
        ? '¿Empezar a atender esta asignación ahora?'
        : '¿Cancelar esta asignación?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Confirmar',
          style: nuevoEstado === 'CANCELADA' ? 'destructive' : 'default',
          onPress: () => mutate({ id: asignacion.id, estado: nuevoEstado }),
        },
      ]
    );
  }

  return (
    <View
      style={{
        backgroundColor: C.blanco,
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: expandida ? C.verde : C.borde,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Barra de gravedad arriba */}
      <View
        style={{
          height: 3,
          backgroundColor: gravedadColor(asignacion.reporte.gravedad),
          opacity: 0.6,
        }}
      />

      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          {/* Badge gravedad */}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: gravedadColor(asignacion.reporte.gravedad) + '20',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '900',
                color: gravedadColor(asignacion.reporte.gravedad),
              }}
            >
              {asignacion.reporte.gravedad}
            </Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: C.texto, lineHeight: 20 }}
              numberOfLines={2}
            >
              {asignacion.reporte.titulo}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={12} color={C.textoMuted} />
              <Text style={{ fontSize: 11, color: C.textoMuted }}>
                {asignacion.reporte.comunidad?.nombre}
              </Text>
            </View>
            {asignacion.cuadrilla && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="people-outline" size={12} color={C.textoMuted} />
                <Text style={{ fontSize: 11, color: C.textoMuted }}>
                  {asignacion.cuadrilla.nombre}
                </Text>
              </View>
            )}
          </View>

          {/* Estado chip + chevron */}
          <View style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: s.bg,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 99,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: s.text }}>{s.label}</Text>
            </View>
            <Ionicons
              name={expandida ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={C.textoMuted}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Panel de acciones expandido */}
      {expandida && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: C.borde,
              padding: 14,
              backgroundColor: '#fafcfa',
              gap: 10,
            }}
          >
            {/* Nota si hay */}
            {asignacion.nota && (
              <View
                style={{
                  backgroundColor: C.amber,
                  borderRadius: 8,
                  padding: 10,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons name="information-circle-outline" size={16} color={C.amberText} />
                <Text style={{ flex: 1, fontSize: 12, color: C.amberText, lineHeight: 18 }}>
                  {asignacion.nota}
                </Text>
              </View>
            )}

            {/* Categoría */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View
                style={{
                  backgroundColor: C.borde,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoSub }}>
                  {asignacion.reporte.categoria}
                </Text>
              </View>
            </View>

            {/* Botones de acción */}
            {finalizado ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: estado === 'COMPLETADA' ? C.verdeMid : C.rojo,
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <Ionicons
                  name={estado === 'COMPLETADA' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={estado === 'COMPLETADA' ? '#16a34a' : C.rojoDot}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: estado === 'COMPLETADA' ? C.verdeText : C.rojoText,
                  }}
                >
                  {estado === 'COMPLETADA' ? 'Trabajo completado ✓' : 'Asignación cancelada'}
                </Text>
              </View>
            ) : isPending ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <ActivityIndicator color={C.verde} />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {/* Botón principal según estado */}
                {estado === 'ASIGNADA' && (
                  <TouchableOpacity
                    onPress={() => confirmarCambio('EN_CURSO', 'Iniciar trabajo')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: C.azulDot,
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <Ionicons name="construct" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                      Iniciar trabajo
                    </Text>
                  </TouchableOpacity>
                )}

                {estado === 'EN_CURSO' && (
                  <TouchableOpacity
                    onPress={() => confirmarCambio('COMPLETADA', 'Marcar completado')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: C.verde,
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                      ¡Trabajo terminado!
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Cancelar siempre disponible si no está finalizado */}
                <TouchableOpacity
                  onPress={() => confirmarCambio('CANCELADA', 'Cancelar asignación')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: C.blanco,
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: C.rojoDot + '60',
                  }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={C.rojoDot} />
                  <Text style={{ color: C.rojoDot, fontWeight: '600', fontSize: 13 }}>
                    Cancelar asignación
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export function CuadrillasScreen() {
  const [filtro, setFiltro] = useState<FiltroEstado>('TODAS');
  const [refrescando, setRefrescando] = useState(false);

  const { data, isLoading, isError, refetch } = useAsignaciones({
    estado: filtro === 'TODAS' ? undefined : filtro,
  });

  const asignaciones: any[] = data?.data ?? [];
  const activas = asignaciones.filter(
    (a) => a.estado === 'ASIGNADA' || a.estado === 'EN_CURSO'
  ).length;

  async function onRefresh() {
    setRefrescando(true);
    await refetch();
    setRefrescando(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.verde,
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text
              style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}
            >
              Cuadrillas
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Gestión de asignaciones de trabajo
            </Text>
          </View>
          {activas > 0 && (
            <View
              style={{
                backgroundColor: C.amberDot,
                borderRadius: 99,
                paddingHorizontal: 12,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }}
              />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                {activas} activa{activas !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 14 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTROS.map((f) => {
            const activo = filtro === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFiltro(f.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: activo ? '#fff' : 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: activo ? '#fff' : 'rgba(255,255,255,0.25)',
                }}
              >
                <Ionicons
                  name={f.icon as any}
                  size={13}
                  color={activo ? C.verde : 'rgba(255,255,255,0.8)'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: activo ? C.verde : 'rgba(255,255,255,0.9)',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenido */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={C.verde}
            colors={[C.verde]}
          />
        }
      >
        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={C.verde} />
            <Text style={{ color: C.textoMuted, marginTop: 10, fontSize: 13 }}>
              Cargando asignaciones...
            </Text>
          </View>
        )}

        {isError && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Ionicons name="warning-outline" size={48} color={C.textoMuted} />
            <Text style={{ color: C.textoMuted, fontSize: 14 }}>
              Error al cargar asignaciones
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                backgroundColor: C.verde,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && asignaciones.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Ionicons name="checkmark-done-circle-outline" size={56} color={C.verdeBorde} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.texto }}>
              {filtro === 'TODAS'
                ? 'Sin asignaciones'
                : `Sin asignaciones ${FILTROS.find((f) => f.value === filtro)?.label.toLowerCase()}`}
            </Text>
            <Text
              style={{ fontSize: 13, color: C.textoMuted, textAlign: 'center', maxWidth: 260 }}
            >
              {filtro === 'TODAS'
                ? 'Cuando un administrador asigne trabajo a tu cuadrilla aparecerá aquí.'
                : 'Prueba con otro filtro.'}
            </Text>
          </View>
        )}

        {!isLoading &&
          asignaciones.map((a: any) => <TarjetaAsignacion key={a.id} asignacion={a} />)}
      </ScrollView>
    </View>
  );
}