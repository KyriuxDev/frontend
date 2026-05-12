import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, TextInput,
} from 'react-native';
import { useState, useMemo } from 'react';
import { ComunidadResumen } from './comunidad.types';
import MapaComunidades from './MapaComunidades';
import { useOaxacaComunidades } from '@/src/hooks/useOaxaca';
import { Ionicons } from '@expo/vector-icons';

// ─── Tokens ──────────────────────────────────────────────────────────────────
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
  amber:      '#fef3c7', amberText: '#92400e', amberDot: '#d97706',
  rojo:       '#fee2e2', rojoText:  '#991b1b', rojoDot:  '#dc2626',
};

const isWeb = Platform.OS === 'web';

// ─── Tipos filtro ─────────────────────────────────────────────────────────────
type FiltroNivel = 'TODOS' | 'CRITICO' | 'ALERTA' | 'ESTABLE';

const FILTROS: { label: string; value: FiltroNivel }[] = [
  { label: 'Todas',   value: 'TODOS'   },
  { label: 'Crítico', value: 'CRITICO' },
  { label: 'Alerta',  value: 'ALERTA'  },
  { label: 'Estable', value: 'ESTABLE' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function irsuColor(v: number) {
  if (v > 100) return C.rojoDot;
  if (v > 50)  return C.amberDot;
  return '#16a34a';
}

function irsuNivel(v: number): FiltroNivel {
  if (v > 100) return 'CRITICO';
  if (v > 50)  return 'ALERTA';
  return 'ESTABLE';
}

type StatusCfg = { bg: string; text: string; dot: string; label: string };
function statusCfg(irsu: number): StatusCfg {
  if (irsu > 100) return { bg: C.rojo,    text: C.rojoText,  dot: C.rojoDot,  label: 'CRÍTICO' };
  if (irsu > 50)  return { bg: C.amber,   text: C.amberText, dot: C.amberDot, label: 'ALERTA'  };
  return               { bg: C.verdeMid, text: C.verdeText, dot: '#16a34a',  label: 'ESTABLE' };
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function Chip({ irsu }: { irsu: number }) {
  const s = statusCfg(irsu);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: s.text }}>{s.label}</Text>
    </View>
  );
}

function FormulaBanner() {
  return (
    <View style={{
      backgroundColor: C.blanco,
      borderWidth: 1, borderColor: C.borde,
      borderRadius: isWeb ? 10 : 0,
      padding: 16,
      flexDirection: isWeb ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: isWeb ? 'center' : 'flex-start',
      gap: 12,
    }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: C.verde }}>
          Indicador de Riesgo Social Urbano (IRSU)
        </Text>
        <Text style={{ fontSize: 12, color: C.textoMuted, marginTop: 4 }}>
          Cálculo basado en factores de vulnerabilidad comunitaria.
        </Text>
      </View>
      <View style={{
        backgroundColor: C.verde, borderRadius: 8,
        paddingHorizontal: 20, paddingVertical: 10,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 2 }}>
          FÓRMULA INSTITUCIONAL
        </Text>
        <Text style={{ fontSize: isWeb ? 20 : 16, fontWeight: '800', color: '#fff', letterSpacing: 2, fontFamily: 'monospace' }}>
          IRSU = (F × G × T) / R
        </Text>
      </View>
    </View>
  );
}

function RankingPanel({
  comunidades, isLoading, busqueda,
}: { comunidades: ComunidadResumen[]; isLoading: boolean; busqueda: string }) {
  const ordenadas = [...comunidades].sort((a, b) => b.irsuActual - a.irsuActual);

  // Resalta el texto que coincide con la búsqueda (solo mobile/texto)
  function resaltarNombre(nombre: string): string {
    return nombre;
  }

  return (
    <View style={{
      backgroundColor: C.blanco,
      borderWidth: 1, borderColor: C.borde,
      borderRadius: 10,
      overflow: 'hidden',
      flex: isWeb ? undefined : 1,
      width: isWeb ? 340 : undefined,
      flexShrink: 0,
    }}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: C.bordeLight,
        backgroundColor: '#fafcfa',
      }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.6 }}>
          RANKING DE RIESGO
        </Text>
        <Text style={{ fontSize: 12, color: C.textoMuted }}>
          {ordenadas.length} {ordenadas.length === 1 ? 'comunidad' : 'comunidades'}
        </Text>
      </View>

      <View style={{
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8,
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1, borderBottomColor: C.bordeLight,
      }}>
        <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>COMUNIDAD</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, width: 60, textAlign: 'center' }}>SCORE</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, width: 80, textAlign: 'right' }}>ESTATUS</Text>
      </View>

      {isLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator color={C.verde} />
        </View>
      )}

      {!isLoading && ordenadas.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <Ionicons name="search-outline" size={36} color={C.textoMuted} />
          <Text style={{ color: C.textoMuted, fontSize: 13 }}>
            {busqueda.length > 0 ? `Sin resultados para "${busqueda}"` : 'Sin comunidades registradas'}
          </Text>
        </View>
      )}

      {ordenadas.map((com, idx) => {
        const color = irsuColor(com.irsuActual);
        return (
          <View
            key={com.id}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 12,
              borderBottomWidth: idx < ordenadas.length - 1 ? 1 : 0,
              borderBottomColor: C.bordeLight,
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: color }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.texto }} numberOfLines={1}>
                  {com.nombre}
                </Text>
                <Text style={{ fontSize: 11, color: C.textoMuted }}>{com.municipio.nombre}</Text>
              </View>
            </View>
            <Text style={{
              fontSize: 15, fontWeight: '800', color,
              width: 60, textAlign: 'center', fontFamily: 'monospace',
            }}>
              {com.irsuActual.toFixed(1)}
            </Text>
            <View style={{ width: 80, alignItems: 'flex-end' }}>
              <Chip irsu={com.irsuActual} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AlertCard({ com }: { com: ComunidadResumen }) {
  return (
    <View style={{
      backgroundColor: C.blanco,
      borderLeftWidth: 4, borderLeftColor: C.rojoDot,
      borderWidth: 1, borderColor: C.borde,
      borderRadius: 10, padding: 16,
      flex: 1, minWidth: isWeb ? 220 : undefined,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.rojoDot, letterSpacing: 0.5, marginBottom: 4 }}>ALERTA ROJA</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.texto }} numberOfLines={1}>{com.nombre}</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: '800', color: C.rojoDot, fontFamily: 'monospace', marginLeft: 8 }}>
          {com.irsuActual.toFixed(1)}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: C.textoMuted, marginBottom: 14 }}>
        El índice IRSU supera el umbral crítico institucional (100). Se requiere intervención.
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fef2f2', borderRadius: 6,
        paddingHorizontal: 12, paddingVertical: 8,
      }}>
        <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: C.rojoDot }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.rojoText }}>ACCIÓN REQUERIDA</Text>
      </View>
    </View>
  );
}

function AlertasSection({ criticas }: { criticas: ComunidadResumen[] }) {
  if (criticas.length === 0) return null;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.rojoDot }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: C.texto }}>
          Alertas Críticas Activas (IRSU {'>'} 100)
        </Text>
      </View>
      <View style={{ flexDirection: isWeb ? 'row' : 'column', flexWrap: 'wrap', gap: 14 }}>
        {criticas.map((com) => <AlertCard key={com.id} com={com} />)}
        {isWeb && criticas.length % 4 !== 0 && (
          <View style={{
            flex: 1, minWidth: 220,
            backgroundColor: '#f9fafb',
            borderWidth: 1, borderColor: C.borde,
            borderRadius: 10, padding: 16,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="notifications-outline" size={28} color={C.textoMuted} />
            <Text style={{ fontSize: 12, color: C.textoMuted, textAlign: 'center', marginTop: 6 }}>
              No hay más alertas críticas en este cuadrante.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────
export function ListaComunidades() {
  const { data: todasComunidades = [], isLoading, isError, refetch } = useOaxacaComunidades('ACTIVO');

  const [busqueda, setBusqueda]       = useState('');
  const [filtroNivel, setFiltroNivel] = useState<FiltroNivel>('TODOS');

  // Filtrado reactivo
  const comunidades = useMemo(() => {
    let lista = todasComunidades as ComunidadResumen[];

    if (busqueda.trim().length > 0) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((c) => c.nombre.toLowerCase().includes(q));
    }

    if (filtroNivel !== 'TODOS') {
      lista = lista.filter((c) => irsuNivel(c.irsuActual) === filtroNivel);
    }

    return lista;
  }, [todasComunidades, busqueda, filtroNivel]);

  const criticas = comunidades.filter((c) => c.irsuActual > 100);

  const hayFiltro = busqueda.trim().length > 0 || filtroNivel !== 'TODOS';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Header con búsqueda y chips ──────────────────────────────────────── */}
      {!isWeb && (
        <View style={{ backgroundColor: C.verde, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16 }}>
          {/* Título */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>IRSU</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>Comunidades</Text>
          </View>

          {/* Barra de búsqueda */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
            marginBottom: 10,
          }}>
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.6)" />
            <TextInput
              value={busqueda}
              onChangeText={(t) => setBusqueda(t)}
              placeholder="Buscar comunidad..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{ flex: 1, fontSize: 14, color: '#fff' }}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Chips de filtro */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FILTROS.map((f) => {
                const activo = filtroNivel === f.value;
                return (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => setFiltroNivel(f.value)}
                    style={{
                      borderRadius: 99,
                      paddingHorizontal: 14, paddingVertical: 5,
                      backgroundColor: activo ? '#fff' : 'transparent',
                      borderWidth: 1,
                      borderColor: activo ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Text style={{
                      fontSize: 12, fontWeight: '600',
                      color: activo ? C.verde : 'rgba(255,255,255,0.75)',
                    }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: isWeb ? 28 : 16, gap: 16 }}>

          {/* Error */}
          {isError && (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <Text style={{ color: C.textoMuted }}>Error al cargar comunidades</Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{ backgroundColor: C.verde, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Fórmula */}
          <FormulaBanner />

          {/* Buscador web (sobre el ranking) */}
          {isWeb && (
            <View style={{
              backgroundColor: C.blanco,
              borderWidth: 1, borderColor: C.borde,
              borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}>
              <Ionicons name="search-outline" size={18} color={C.textoMuted} />
              <TextInput
                value={busqueda}
                onChangeText={(t) => setBusqueda(t)}
                placeholder="Buscar comunidad..."
                placeholderTextColor={C.textoMuted}
                style={{ flex: 1, fontSize: 14, color: C.texto, outlineStyle: 'none' } as any}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda('')}>
                  <Ionicons name="close-circle" size={16} color={C.textoMuted} />
                </TouchableOpacity>
              )}

              {/* Chips filtro web */}
              <View style={{ flexDirection: 'row', gap: 6, marginLeft: 6 }}>
                {FILTROS.map((f) => {
                  const activo = filtroNivel === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      onPress={() => setFiltroNivel(f.value)}
                      style={{
                        borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
                        backgroundColor: activo ? C.verde : C.blanco,
                        borderWidth: 1, borderColor: activo ? C.verde : C.borde,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? '#fff' : C.textoSub }}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Contador resultados */}
          {hayFiltro && !isLoading && (
            <Text style={{ fontSize: 12, color: C.textoMuted, paddingHorizontal: 2 }}>
              {comunidades.length === 0
                ? `Sin resultados${busqueda.length > 0 ? ` para "${busqueda}"` : ''}`
                : `${comunidades.length} ${comunidades.length === 1 ? 'comunidad' : 'comunidades'} encontrada${comunidades.length === 1 ? '' : 's'}${busqueda.length > 0 ? ` para "${busqueda}"` : ''}`
              }
            </Text>
          )}

          {/* Estado vacío con filtro activo */}
          {hayFiltro && !isLoading && comunidades.length === 0 && (
            <View style={{
              backgroundColor: C.blanco,
              borderWidth: 1, borderColor: C.borde,
              borderRadius: 10, padding: 32,
              alignItems: 'center', gap: 10,
            }}>
              <Ionicons name="search-outline" size={40} color={C.textoMuted} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.texto }}>Sin resultados</Text>
              <Text style={{ fontSize: 13, color: C.textoMuted, textAlign: 'center' }}>
                {busqueda.length > 0
                  ? `No encontramos ninguna comunidad con "${busqueda}"`
                  : `No hay comunidades en nivel ${filtroNivel.toLowerCase()}`
                }
              </Text>
              <TouchableOpacity
                onPress={() => { setBusqueda(''); setFiltroNivel('TODOS'); }}
                style={{
                  backgroundColor: C.verdeLight, borderWidth: 1, borderColor: '#b8e0c5',
                  borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7, marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.verde }}>Limpiar filtros</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ranking + mapa */}
          {(comunidades.length > 0 || isLoading) && (
            <View style={{
              flexDirection: isWeb ? 'row' : 'column',
              gap: 16,
              minHeight: isWeb ? 480 : undefined,
            }}>
              <RankingPanel comunidades={comunidades} isLoading={isLoading} busqueda={busqueda} />

              {isWeb ? (
                <View style={{
                  flex: 1,
                  backgroundColor: C.blanco,
                  borderWidth: 1, borderColor: C.borde,
                  borderRadius: 10,
                  overflow: 'hidden',
                  minHeight: 480,
                }}>
                  <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderBottomWidth: 1, borderBottomColor: C.bordeLight,
                    backgroundColor: '#fafcfa',
                    zIndex: 10, position: 'relative',
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.6 }}>
                      MAPA DE CALOR — IRSU MUNICIPAL
                    </Text>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      backgroundColor: C.verdeLight, borderRadius: 99,
                      paddingHorizontal: 10, paddingVertical: 4,
                    }}>
                      <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: '#22c55e' }} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: C.verde }}>EN VIVO</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    {isLoading ? (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color={C.verde} size="large" />
                        <Text style={{ color: C.textoMuted, marginTop: 10, fontSize: 13 }}>Cargando mapa...</Text>
                      </View>
                    ) : (
                      <MapaComunidades comunidades={comunidades} />
                    )}
                  </View>
                </View>
              ) : (
                comunidades.length > 0 && (
                  <View style={{
                    backgroundColor: C.blanco,
                    borderWidth: 1, borderColor: C.borde,
                    borderRadius: 10, padding: 16,
                    alignItems: 'center', gap: 8,
                  }}>
                    <Ionicons name="map-outline" size={32} color={C.textoMuted} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: C.texto }}>
                      Mapa disponible en versión web
                    </Text>
                    <Text style={{ fontSize: 12, color: C.textoMuted, textAlign: 'center' }}>
                      Accede desde un navegador para ver el mapa de calor IRSU.
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {/* Alertas críticas (solo si no hay filtro activo o el filtro incluye críticos) */}
          {(!hayFiltro || filtroNivel === 'CRITICO' || filtroNivel === 'TODOS') && (
            <AlertasSection criticas={criticas} />
          )}

          <View style={{ height: isWeb ? 8 : 80 }} />
        </View>
      </ScrollView>
    </View>
  );
}