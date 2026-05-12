import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlertas, useTomarAlerta, useCerrarAlerta, NivelAlerta, EstadoAlerta } from '@/src/features/alertas/alerta.queries';
import { formatearFechaCorta } from '@/src/utils/formatDate';

// ─── Tokens (mismo sistema que PanelAdmin) ────────────────────────────────────
const C = {
  verde:      '#1d4e32',
  verdeHover: '#edf7f0',
  verdeMid:   '#dcfce7',
  verdeText:  '#166534',
  bg:         '#f4f6f4',
  blanco:     '#ffffff',
  borde:      '#e8ede8',
  bordeLight: '#f0f4f0',
  texto:      '#0f1f0f',
  textoSub:   '#4a5e4a',
  textoMuted: '#9aaa9a',
  amber:      '#fef3c7', amberText: '#92400e', amberDot: '#d97706',
  azul:       '#dbeafe', azulText:  '#1e40af', azulDot:  '#3b82f6',
  rojo:       '#fee2e2', rojoText:  '#991b1b', rojoDot:  '#dc2626',
};

function nivelCfg(nivel: NivelAlerta) {
  return nivel === 'ROJA'
    ? { bg: C.rojo,  text: C.rojoText,  dot: C.rojoDot,  label: 'Roja'     }
    : { bg: C.amber, text: C.amberText, dot: C.amberDot, label: 'Amarilla' };
}

function estadoCfg(estado: EstadoAlerta) {
  switch (estado) {
    case 'ACTIVA':      return { bg: C.rojo,    text: C.rojoText,  dot: C.rojoDot,  label: 'Activa'      };
    case 'EN_ATENCION': return { bg: C.amber,   text: C.amberText, dot: C.amberDot, label: 'En Atención' };
    case 'CERRADA':     return { bg: C.verdeMid, text: C.verdeText, dot: '#16a34a', label: 'Cerrada'     };
  }
}

function StatCard({ label, value, color, icon }: {
  label: string; value: number;
  color: string; icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  return (
    <View style={{
      flex: 1, minWidth: 130, backgroundColor: C.blanco,
      borderRadius: 10, borderWidth: 1, borderColor: C.borde,
      borderTopWidth: 3, borderTopColor: color, padding: 16,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Text>
        <MaterialIcons name={icon} size={20} color={color} style={{ opacity: 0.4 }} />
      </View>
      <Text style={{ fontSize: 30, fontWeight: '800', color: C.texto, letterSpacing: -1 }}>
        {value}
      </Text>
    </View>
  );
}

// ─── Fila de alerta ───────────────────────────────────────────────────────────
function FilaAlerta({ alerta }: { alerta: any }) {
  const [open, setOpen]   = useState(false);
  const [nota, setNota]   = useState('');
  const { mutate: tomar,  isPending: tomando  } = useTomarAlerta();
  const { mutate: cerrar, isPending: cerrando } = useCerrarAlerta();

  const nivel  = nivelCfg(alerta.nivel);
  const estado = estadoCfg(alerta.estado);
  const isPending = tomando || cerrando;

  return (
    <View style={{
      borderRadius: 8, borderWidth: 1,
      borderColor: open ? (alerta.nivel === 'ROJA' ? C.rojoDot : C.amberDot) : C.borde,
      marginBottom: 6, backgroundColor: C.blanco, overflow: 'hidden',
    }}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
      >
        {/* Indicador nivel */}
        <View style={{
          width: 3, height: 38, borderRadius: 2,
          backgroundColor: nivel.dot,
        }} />

        {/* Info principal */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: C.texto }} numberOfLines={1}>
            {alerta.comunidad.nombre}
          </Text>
          <Text style={{ fontSize: 11, color: C.textoMuted, marginTop: 2 }}>
            {alerta.categoria} · IRSU {alerta.irsuValor.toFixed(1)} · {formatearFechaCorta(alerta.createdAt)}
          </Text>
        </View>

        {/* Chips nivel + estado */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: nivel.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: nivel.dot }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: nivel.text }}>{nivel.label}</Text>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: estado.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: estado.dot }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: estado.text }}>{estado.label}</Text>
        </View>

        <MaterialIcons
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={20} color={C.textoMuted}
        />
      </TouchableOpacity>

      {open && (
        <View style={{
          borderTopWidth: 1, borderTopColor: C.bordeLight,
          padding: 12, backgroundColor: '#fafcfa', gap: 10,
        }}>
          {/* Asignado a */}
          {alerta.usuario && (
            <Text style={{ fontSize: 12, color: C.textoSub }}>
              Atendido por:{' '}
              <Text style={{ fontWeight: '700' }}>
                {alerta.usuario.nombre ?? alerta.usuario.email}
              </Text>
            </Text>
          )}

          {alerta.estado === 'CERRADA' ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: C.verdeMid, borderRadius: 8, padding: 10,
            }}>
              <MaterialIcons name="check-circle" size={18} color="#16a34a" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.verdeText }}>
                Alerta cerrada
              </Text>
            </View>
          ) : isPending ? (
            <ActivityIndicator color={C.verde} />
          ) : (
            <View style={{ gap: 8 }}>
              {/* Nota para cerrar */}
              {alerta.estado === 'EN_ATENCION' && (
                <TextInput
                  value={nota}
                  onChangeText={setNota}
                  placeholder="Nota de cierre (opcional)..."
                  placeholderTextColor={C.textoMuted}
                  style={{
                    borderWidth: 1, borderColor: C.borde, borderRadius: 8,
                    padding: 10, fontSize: 13, color: C.texto, backgroundColor: C.blanco,
                  }}
                />
              )}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {alerta.estado === 'ACTIVA' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Tomar alerta', '¿Tomar atención de esta alerta?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Tomar', onPress: () => tomar(alerta.id) },
                      ])
                    }
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                      backgroundColor: alerta.nivel === 'ROJA' ? C.rojoDot : C.amberDot,
                    }}
                  >
                    <MaterialIcons name="pan-tool" size={15} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                      Tomar atención
                    </Text>
                  </TouchableOpacity>
                )}

                {alerta.estado === 'EN_ATENCION' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Cerrar alerta', '¿Confirmar cierre de la alerta?', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Cerrar',
                          onPress: () => cerrar({ id: alerta.id, nota: nota.trim() || undefined }),
                        },
                      ])
                    }
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                      backgroundColor: C.verde,
                    }}
                  >
                    <MaterialIcons name="check-circle" size={15} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                      Cerrar alerta
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── SeccionAlertas principal ─────────────────────────────────────────────────
export function SeccionAlertas() {
  const [filtroEstado, setFiltroEstado] = useState<EstadoAlerta | undefined>('ACTIVA');
  const [filtroNivel,  setFiltroNivel]  = useState<NivelAlerta  | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useAlertas({
    estado: filtroEstado,
    nivel:  filtroNivel,
  });

  const alertas: any[] = data?.data ?? [];

  const rojas      = alertas.filter((a) => a.nivel  === 'ROJA').length;
  const activas    = alertas.filter((a) => a.estado === 'ACTIVA').length;
  const enAtencion = alertas.filter((a) => a.estado === 'EN_ATENCION').length;

  const FILTROS_ESTADO: { label: string; value: EstadoAlerta | undefined }[] = [
    { label: 'Activas',     value: 'ACTIVA'      },
    { label: 'En Atención', value: 'EN_ATENCION' },
    { label: 'Cerradas',    value: 'CERRADA'     },
    { label: 'Todas',       value: undefined     },
  ];

  const FILTROS_NIVEL: { label: string; value: NivelAlerta | undefined }[] = [
    { label: 'Todos',    value: undefined   },
    { label: 'Roja',     value: 'ROJA'     },
    { label: 'Amarilla', value: 'AMARILLA' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Rojas"       value={rojas}      color={C.rojoDot}  icon="warning"         />
        <StatCard label="Sin atender" value={activas}    color={C.amberDot} icon="notifications"   />
        <StatCard label="En Atención" value={enAtencion} color={C.azulDot}  icon="pan-tool"        />
      </View>

      {/* Filtros estado */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {FILTROS_ESTADO.map((f) => {
          const activo = filtroEstado === f.value;
          return (
            <TouchableOpacity
              key={String(f.value)}
              onPress={() => setFiltroEstado(f.value)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99,
                backgroundColor: activo ? C.rojoDot : C.blanco,
                borderWidth: 1, borderColor: activo ? C.rojoDot : C.borde,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? '#fff' : C.textoSub }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filtros nivel */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {FILTROS_NIVEL.map((f) => {
          const activo = filtroNivel === f.value;
          return (
            <TouchableOpacity
              key={String(f.value)}
              onPress={() => setFiltroNivel(f.value)}
              style={{
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99,
                backgroundColor: activo ? C.azul : C.blanco,
                borderWidth: 1, borderColor: activo ? C.azulDot : C.borde,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? C.azulText : C.textoSub }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Encabezado tabla */}
      <View style={{
        flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8,
        borderWidth: 1, borderColor: C.borde,
      }}>
        <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
          COMUNIDAD / CATEGORÍA
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, marginRight: 8 }}>
          NIVEL
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>
          ESTADO
        </Text>
      </View>

      {isLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={C.rojoDot} size="large" />
          <Text style={{ color: C.textoMuted, marginTop: 10 }}>Cargando alertas...</Text>
        </View>
      )}

      {isError && (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
          <MaterialIcons name="error-outline" size={40} color={C.textoMuted} />
          <Text style={{ color: C.textoMuted }}>Error al cargar alertas</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{ backgroundColor: C.rojoDot, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && alertas.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
          <MaterialIcons name="notifications-off" size={48} color={C.textoMuted} />
          <Text style={{ color: C.textoMuted }}>Sin alertas con este filtro</Text>
        </View>
      )}

      {alertas.map((a) => (
        <FilaAlerta key={a.id} alerta={a} />
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}