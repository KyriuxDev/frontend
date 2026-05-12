import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  TextInput,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/auth.store';
import {
  useAlertas,
  useTomarAlerta,
  useCerrarAlerta,
  NivelAlerta,
  EstadoAlerta,
} from './alerta.queries';
import { formatearFechaCorta } from '@/src/utils/formatDate';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  verde:      '#1d4e32',
  verdeLight: '#edf7f0',
  verdeMid:   '#dcfce7',
  verdeText:  '#166534',
  bg:         '#f4f6f4',
  blanco:     '#ffffff',
  borde:      '#e8ede8',
  bordeLight: '#f0f4f0',
  texto:      '#0f1f0f',
  textoSub:   '#4a5e4a',
  textoMuted: '#9aaa9a',
  amber:      '#fef3c7',
  amberText:  '#92400e',
  amberDot:   '#d97706',
  rojo:       '#fee2e2',
  rojoText:   '#991b1b',
  rojoDot:    '#dc2626',
};

const ROLES_AUTORIDAD = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR'];

function nivelCfg(nivel: NivelAlerta) {
  return nivel === 'ROJA'
    ? { bg: C.rojo,  text: C.rojoText,  dot: C.rojoDot,  label: 'Alerta Roja',     icon: 'warning'      as const }
    : { bg: C.amber, text: C.amberText, dot: C.amberDot, label: 'Alerta Amarilla', icon: 'alert-circle' as const };
}

function estadoCfg(estado: EstadoAlerta) {
  switch (estado) {
    case 'ACTIVA':      return { bg: C.rojo,    text: C.rojoText,  dot: C.rojoDot,  label: 'Activa'      };
    case 'EN_ATENCION': return { bg: C.amber,   text: C.amberText, dot: C.amberDot, label: 'En Atención' };
    case 'CERRADA':     return { bg: C.verdeMid, text: C.verdeText, dot: '#16a34a', label: 'Cerrada'     };
  }
}

// ─── Tarjeta solo lectura (USUARIO) ──────────────────────────────────────────
function TarjetaAlertaPublica({ alerta }: { alerta: any }) {
  const nivel  = nivelCfg(alerta.nivel);
  const estado = estadoCfg(alerta.estado);

  return (
    <View
      style={{
        backgroundColor: C.blanco,
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.borde,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Franja de color */}
      <View style={{ height: 4, backgroundColor: alerta.nivel === 'ROJA' ? C.rojoDot : C.amberDot }} />

      <View style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        {/* Ícono */}
        <View style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: nivel.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Ionicons name={nivel.icon} size={22} color={nivel.dot} />
        </View>

        {/* Contenido */}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: nivel.dot }}>
              {nivel.label}
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: estado.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: estado.dot }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: estado.text }}>{estado.label}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 14, fontWeight: '700', color: C.texto }}>
            {alerta.comunidad.nombre}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View style={{
              backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoSub }}>
                {alerta.categoria}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: C.textoMuted }}>
              IRSU {alerta.irsuValor.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 11, color: C.textoMuted }}>
              {formatearFechaCorta(alerta.createdAt)}
            </Text>
          </View>

          {/* Mensaje informativo según estado */}
          <View style={{
            backgroundColor: alerta.estado === 'EN_ATENCION' ? C.amber : nivel.bg,
            borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4,
            flexDirection: 'row', alignItems: 'center', gap: 6,
          }}>
            <Ionicons
              name={alerta.estado === 'EN_ATENCION' ? 'construct-outline' : 'information-circle-outline'}
              size={14}
              color={alerta.estado === 'EN_ATENCION' ? C.amberDot : nivel.dot}
            />
            <Text style={{ fontSize: 11, color: alerta.estado === 'EN_ATENCION' ? C.amberText : nivel.text, flex: 1 }}>
              {alerta.estado === 'EN_ATENCION'
                ? 'Las autoridades ya están atendiendo esta situación.'
                : 'Esta zona requiere atención. Las autoridades han sido notificadas.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Tarjeta con acciones (AUTORIDAD) ─────────────────────────────────────────
function TarjetaAlertaAutoridad({ alerta }: { alerta: any }) {
  const [expandida, setExpandida] = useState(false);
  const [nota, setNota]           = useState('');
  const fadeAnim                  = useRef(new Animated.Value(0)).current;

  const { mutate: tomar,  isPending: tomando  } = useTomarAlerta();
  const { mutate: cerrar, isPending: cerrando } = useCerrarAlerta();

  const nivel  = nivelCfg(alerta.nivel);
  const estado = estadoCfg(alerta.estado);
  const isPending = tomando || cerrando;

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

  return (
    <View style={{
      backgroundColor: C.blanco, borderRadius: 14, marginBottom: 12,
      overflow: 'hidden', borderWidth: 1.5,
      borderColor: expandida ? (alerta.nivel === 'ROJA' ? C.rojoDot : C.amberDot) : C.borde,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    }}>
      <View style={{ height: 4, backgroundColor: alerta.nivel === 'ROJA' ? C.rojoDot : C.amberDot }} />

      <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{
            width: 42, height: 42, borderRadius: 12,
            backgroundColor: nivel.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ionicons name={nivel.icon} size={22} color={nivel.dot} />
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.texto }} numberOfLines={1}>
              {alerta.comunidad.nombre}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoSub }}>{alerta.categoria}</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.textoMuted }}>
                IRSU {alerta.irsuValor.toFixed(1)} · {formatearFechaCorta(alerta.createdAt)}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: estado.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: estado.dot }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: estado.text }}>{estado.label}</Text>
            </View>
            <Ionicons name={expandida ? 'chevron-up' : 'chevron-down'} size={16} color={C.textoMuted} />
          </View>
        </View>
      </TouchableOpacity>

      {expandida && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={{
            borderTopWidth: 1, borderTopColor: C.bordeLight,
            padding: 14, backgroundColor: '#fafcfa', gap: 10,
          }}>
            {alerta.usuario && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="person-circle-outline" size={16} color={C.textoMuted} />
                <Text style={{ fontSize: 12, color: C.textoSub }}>
                  Atendido por:{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {alerta.usuario.nombre ?? alerta.usuario.email}
                  </Text>
                </Text>
              </View>
            )}

            {alerta.estado === 'CERRADA' ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: C.verdeMid, borderRadius: 10, padding: 12,
              }}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.verdeText }}>
                  Alerta cerrada y resuelta
                </Text>
              </View>
            ) : isPending ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <ActivityIndicator color={C.verde} />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {alerta.estado === 'EN_ATENCION' && (
                  <TextInput
                    value={nota} onChangeText={setNota}
                    placeholder="Nota de cierre (opcional)..."
                    placeholderTextColor={C.textoMuted}
                    multiline numberOfLines={2}
                    style={{
                      borderWidth: 1, borderColor: C.borde, borderRadius: 8,
                      padding: 10, fontSize: 13, color: C.texto, backgroundColor: C.blanco,
                      minHeight: 52, textAlignVertical: 'top',
                    }}
                  />
                )}

                {alerta.estado === 'ACTIVA' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Tomar alerta', `¿Tomar la atención de esta alerta en ${alerta.comunidad.nombre}?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Tomar', onPress: () => tomar(alerta.id) },
                      ])
                    }
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                      backgroundColor: alerta.nivel === 'ROJA' ? C.rojoDot : C.amberDot,
                      borderRadius: 10, padding: 14,
                    }}
                  >
                    <Ionicons name="hand-left" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Tomar atención</Text>
                  </TouchableOpacity>
                )}

                {alerta.estado === 'EN_ATENCION' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Cerrar alerta', '¿Confirmas que la situación fue atendida?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Cerrar', onPress: () => cerrar({ id: alerta.id, nota: nota.trim() || undefined }) },
                      ])
                    }
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                      backgroundColor: C.verde, borderRadius: 10, padding: 14,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Cerrar alerta</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export function AlertasScreen() {
  const usuario     = useAuthStore((s) => s.usuario);
  const esAutoridad = usuario ? ROLES_AUTORIDAD.includes(usuario.rol) : false;

  const [filtroEstado, setFiltroEstado] = useState<EstadoAlerta | undefined>(
    esAutoridad ? 'ACTIVA' : undefined   // usuarios ven todo lo activo por defecto
  );
  const [filtroNivel, setFiltroNivel]   = useState<NivelAlerta | undefined>(undefined);
  const [refrescando, setRefrescando]   = useState(false);

  const { data, isLoading, isError, refetch } = useAlertas({
    // Usuarios solo ven alertas activas y en atención (no las cerradas)
    estado: esAutoridad
      ? filtroEstado
      : filtroEstado ?? undefined,
    nivel: filtroNivel,
  });

  const alertas: any[] = (data?.data ?? []).filter((a: any) =>
    esAutoridad ? true : a.estado !== 'CERRADA'
  );

  const activas = alertas.filter((a) => a.estado === 'ACTIVA').length;
  const rojas   = alertas.filter((a) => a.nivel  === 'ROJA').length;

  async function onRefresh() {
    setRefrescando(true);
    await refetch();
    setRefrescando(false);
  }

  const headerColor = rojas > 0 ? C.rojoDot : C.amberDot;

  const FILTROS_ESTADO_AUTORIDAD: { label: string; value: EstadoAlerta | undefined }[] = [
    { label: 'Activas',     value: 'ACTIVA'      },
    { label: 'En Atención', value: 'EN_ATENCION' },
    { label: 'Cerradas',    value: 'CERRADA'     },
    { label: 'Todas',       value: undefined     },
  ];

  const FILTROS_NIVEL: { label: string; value: NivelAlerta | undefined }[] = [
    { label: 'Todas',    value: undefined   },
    { label: '🔴 Roja',    value: 'ROJA'     },
    { label: '🟡 Amarilla', value: 'AMARILLA' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{
        backgroundColor: headerColor,
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
              Alertas IRSU
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {esAutoridad
                ? 'Incidencias que requieren atención'
                : 'Situaciones activas en tu zona'}
            </Text>
          </View>

          {(rojas > 0 || activas > 0) && (
            <View style={{ gap: 4, alignItems: 'flex-end' }}>
              {rojas > 0 && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99,
                  paddingHorizontal: 10, paddingVertical: 4,
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                }}>
                  <Ionicons name="warning" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>
                    {rojas} roja{rojas !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {activas > 0 && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99,
                  paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 11 }}>
                    {activas} sin atender
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Filtros estado — solo autoridades */}
        {esAutoridad && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
            {FILTROS_ESTADO_AUTORIDAD.map((f) => {
              const activo = filtroEstado === f.value;
              return (
                <TouchableOpacity
                  key={String(f.value)}
                  onPress={() => setFiltroEstado(f.value)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
                    backgroundColor: activo ? '#fff' : 'rgba(255,255,255,0.15)',
                    borderWidth: 1, borderColor: activo ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? headerColor : 'rgba(255,255,255,0.9)' }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Filtro nivel — todos */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
          {FILTROS_NIVEL.map((f) => {
            const activo = filtroNivel === f.value;
            return (
              <TouchableOpacity
                key={String(f.value)}
                onPress={() => setFiltroNivel(f.value)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99,
                  backgroundColor: activo ? 'rgba(255,255,255,0.25)' : 'transparent',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando} onRefresh={onRefresh}
            tintColor={headerColor} colors={[headerColor]}
          />
        }
      >
        {/* Banner informativo para usuarios */}
        {!esAutoridad && (
          <View style={{
            backgroundColor: C.blanco, borderRadius: 12, padding: 14,
            borderWidth: 1, borderColor: C.borde, marginBottom: 16,
            flexDirection: 'row', gap: 10, alignItems: 'flex-start',
          }}>
            <Ionicons name="information-circle" size={20} color={C.amberDot} />
            <Text style={{ flex: 1, fontSize: 12, color: C.textoSub, lineHeight: 18 }}>
              Estas alertas son generadas automáticamente cuando el índice IRSU de una zona supera los niveles de riesgo. Las autoridades son notificadas para actuar.
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={headerColor} />
            <Text style={{ color: C.textoMuted, marginTop: 10, fontSize: 13 }}>Cargando alertas...</Text>
          </View>
        )}

        {isError && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Ionicons name="warning-outline" size={48} color={C.textoMuted} />
            <Text style={{ color: C.textoMuted }}>Error al cargar alertas</Text>
            <TouchableOpacity onPress={() => refetch()}
              style={{ backgroundColor: headerColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && alertas.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Ionicons name="shield-checkmark-outline" size={56} color={C.textoMuted} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.texto }}>
              {esAutoridad ? 'Sin alertas activas' : 'Todo tranquilo por aquí'}
            </Text>
            <Text style={{ fontSize: 13, color: C.textoMuted, textAlign: 'center', maxWidth: 240 }}>
              {esAutoridad
                ? 'No hay alertas con los filtros seleccionados.'
                : 'No hay situaciones de riesgo activas en este momento.'}
            </Text>
          </View>
        )}

        {/* Renderiza tarjeta según rol */}
        {!isLoading && alertas.map((a: any) =>
          esAutoridad
            ? <TarjetaAlertaAutoridad key={a.id} alerta={a} />
            : <TarjetaAlertaPublica   key={a.id} alerta={a} />
        )}
      </ScrollView>
    </View>
  );
}