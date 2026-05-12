import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, TextInput, ScrollView,
  ListRenderItem,
} from 'react-native';
import { useState, useMemo, memo, useCallback } from 'react';
import { ComunidadResumen } from './comunidad.types';
import MapaComunidades from './MapaComunidades';
import { useOaxacaComunidades } from '@/src/hooks/useOaxaca';
import { Ionicons } from '@expo/vector-icons';

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
  bordeLight: '#f0f4f0',
  texto:      '#0f1f0f',
  textoSub:   '#4a5e4a',
  textoMuted: '#9aaa9a',
  amber:      '#fef3c7', amberText: '#92400e', amberDot: '#d97706',
  rojo:       '#fee2e2', rojoText:  '#991b1b', rojoDot:  '#dc2626',
};

const isWeb = Platform.OS === 'web';
const ROW_HEIGHT = 54; // altura fija de cada fila para getItemLayout

// ─── Filtro nivel ─────────────────────────────────────────────────────────────
type FiltroNivel = 'TODOS' | 'CRITICO' | 'ALERTA' | 'ESTABLE';

const FILTROS: { label: string; value: FiltroNivel }[] = [
  { label: 'Todas',   value: 'TODOS'   },
  { label: 'Crítico', value: 'CRITICO' },
  { label: 'Alerta',  value: 'ALERTA'  },
  { label: 'Estable', value: 'ESTABLE' },
];

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
function statusCfg(irsu: number) {
  if (irsu > 100) return { bg: C.rojo,    text: C.rojoText,  dot: C.rojoDot,  label: 'CRÍTICO' };
  if (irsu > 50)  return { bg: C.amber,   text: C.amberText, dot: C.amberDot, label: 'ALERTA'  };
  return               { bg: C.verdeMid, text: C.verdeText, dot: '#16a34a',  label: 'ESTABLE' };
}

// ─── Fila (altura fija) ───────────────────────────────────────────────────────
const FilaRanking = memo(function FilaRanking({ item }: { item: ComunidadResumen }) {
  const color = irsuColor(item.irsuActual);
  const s     = statusCfg(item.irsuActual);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      height: ROW_HEIGHT, paddingHorizontal: 14,
      backgroundColor: C.blanco,
      borderBottomWidth: 1, borderBottomColor: C.bordeLight,
    }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 3, height: 26, borderRadius: 2, backgroundColor: color }} />
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.texto }} numberOfLines={1}>
          {item.nombre}
        </Text>
      </View>
      <Text style={{
        fontSize: 14, fontWeight: '800', color,
        width: 50, textAlign: 'center', fontFamily: 'monospace',
      }}>
        {item.irsuActual.toFixed(1)}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: s.bg, paddingHorizontal: 7, paddingVertical: 3,
        borderRadius: 99, width: 72, justifyContent: 'center',
      }}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: s.dot }} />
        <Text style={{ fontSize: 9, fontWeight: '700', color: s.text }}>{s.label}</Text>
      </View>
    </View>
  );
});

// ─── Mapa lazy ────────────────────────────────────────────────────────────────
const MapaLazy = memo(function MapaLazy({ comunidades }: { comunidades: ComunidadResumen[] }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  function toggle() {
    if (!mounted) setMounted(true);
    setVisible((v) => !v);
  }

  return (
    <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.borde, backgroundColor: C.blanco }}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: visible ? C.verde : C.blanco,
        borderBottomWidth: visible ? 1 : 0, borderBottomColor: C.borde,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="map-outline" size={18} color={visible ? '#fff' : C.verde} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: visible ? '#fff' : C.verde }}>
            Mapa de calor IRSU
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {visible && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>EN VIVO</Text>
            </View>
          )}
          <Ionicons name={visible ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={visible ? '#fff' : C.textoMuted} />
        </View>
      </TouchableOpacity>

      {mounted && (
        <View style={{ height: visible ? 320 : 0, overflow: 'hidden' }}>
          <MapaComunidades comunidades={comunidades} />
        </View>
      )}

      {!mounted && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.verdeLight }}>
          <Ionicons name="information-circle-outline" size={14} color={C.verde} />
          <Text style={{ fontSize: 12, color: C.verdeText }}>
            Toca para abrir el mapa · {comunidades.length} comunidades
          </Text>
        </View>
      )}
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export function ListaComunidades() {
  const { data: todas = [], isLoading, isError, refetch } = useOaxacaComunidades('ACTIVO');

  const [busqueda, setBusqueda]       = useState('');
  const [filtroNivel, setFiltroNivel] = useState<FiltroNivel>('TODOS');

  // Lista filtrada y ordenada — es lo que va directo a la FlatList
  const ordenadas = useMemo(() => {
    let lista = todas as ComunidadResumen[];
    const q   = busqueda.trim().toLowerCase();
    if (q)                   lista = lista.filter((c) => c.nombre.toLowerCase().includes(q));
    if (filtroNivel !== 'TODOS') lista = lista.filter((c) => irsuNivel(c.irsuActual) === filtroNivel);
    return [...lista].sort((a, b) => b.irsuActual - a.irsuActual);
  }, [todas, busqueda, filtroNivel]);

  const criticas  = useMemo(() => ordenadas.filter((c) => c.irsuActual > 100), [ordenadas]);
  const hayFiltro = busqueda.trim().length > 0 || filtroNivel !== 'TODOS';

  // ── Callbacks memoizados para FlatList ────────────────────────────────────
  const renderItem: ListRenderItem<ComunidadResumen> = useCallback(
    ({ item }) => <FilaRanking item={item} />,
    [],
  );
  const keyExtractor = useCallback((item: ComunidadResumen) => String(item.id), []);
  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index }),
    [],
  );

  // ── Cabecera del ranking (fija en el header) ──────────────────────────────
  const RankingHeader = useMemo(() => (
    <View>
      {/* Fila de columnas */}
      <View style={{
        flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: '#f9fafb',
        borderTopWidth: 1, borderTopColor: C.bordeLight,
        borderBottomWidth: 1, borderBottomColor: C.bordeLight,
      }}>
        <Text style={{ flex: 1, fontSize: 9, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5 }}>COMUNIDAD</Text>
        <Text style={{ fontSize: 9, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, width: 50, textAlign: 'center' }}>SCORE</Text>
        <Text style={{ fontSize: 9, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.5, width: 72, textAlign: 'right' }}>ESTATUS</Text>
      </View>
    </View>
  ), []);

  // ── ListHeaderComponent: todo lo que va ANTES de las filas ────────────────
  const ListHeader = useMemo(() => (
    <View style={{ backgroundColor: C.bg }}>

      {/* Header mobile con búsqueda */}
      {!isWeb && (
        <View style={{ backgroundColor: C.verde, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>IRSU</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>Comunidades</Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10,
          }}>
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.6)" />
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar comunidad..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{ flex: 1, fontSize: 14, color: '#fff' }}
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FILTROS.map((f) => {
                const activo = filtroNivel === f.value;
                return (
                  <TouchableOpacity key={f.value} onPress={() => setFiltroNivel(f.value)}
                    style={{
                      borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5,
                      backgroundColor: activo ? '#fff' : 'transparent',
                      borderWidth: 1, borderColor: activo ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? C.verde : 'rgba(255,255,255,0.75)' }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={{ paddingHorizontal: isWeb ? 28 : 16, gap: 14 }}>

        {/* Error */}
        {isError && (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
            <Text style={{ color: C.textoMuted }}>Error al cargar comunidades</Text>
            <TouchableOpacity onPress={() => refetch()}
              style={{ backgroundColor: C.verde, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fórmula */}
        <View style={{
          backgroundColor: C.blanco, borderWidth: 1, borderColor: C.borde,
          borderRadius: isWeb ? 10 : 0, padding: 16,
          flexDirection: isWeb ? 'row' : 'column',
          justifyContent: 'space-between', alignItems: isWeb ? 'center' : 'flex-start', gap: 12,
        }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.verde }}>
              Indicador de Riesgo Social Urbano (IRSU)
            </Text>
            <Text style={{ fontSize: 12, color: C.textoMuted, marginTop: 4 }}>
              Cálculo basado en factores de vulnerabilidad comunitaria.
            </Text>
          </View>
          <View style={{ backgroundColor: C.verde, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 2 }}>
              FÓRMULA INSTITUCIONAL
            </Text>
            <Text style={{ fontSize: isWeb ? 18 : 15, fontWeight: '800', color: '#fff', letterSpacing: 2, fontFamily: 'monospace' }}>
              IRSU = (F × G × T) / R
            </Text>
          </View>
        </View>

        {/* Mapa lazy mobile */}
        {!isWeb && !isLoading && (todas as ComunidadResumen[]).length > 0 && (
          <MapaLazy comunidades={todas as ComunidadResumen[]} />
        )}

        {/* Contador / vacío */}
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <ActivityIndicator size="large" color={C.verde} />
            <Text style={{ color: C.textoMuted, marginTop: 10, fontSize: 13 }}>Cargando comunidades...</Text>
          </View>
        ) : (
          <>
            {hayFiltro && (
              <Text style={{ fontSize: 12, color: C.textoMuted }}>
                {ordenadas.length === 0
                  ? `Sin resultados${busqueda.length > 0 ? ` para "${busqueda}"` : ''}`
                  : `${ordenadas.length} comunidad${ordenadas.length !== 1 ? 'es' : ''} encontrada${ordenadas.length !== 1 ? 's' : ''}`
                }
              </Text>
            )}

            {hayFiltro && ordenadas.length === 0 && (
              <View style={{
                backgroundColor: C.blanco, borderWidth: 1, borderColor: C.borde,
                borderRadius: 10, padding: 28, alignItems: 'center', gap: 10,
              }}>
                <Ionicons name="search-outline" size={36} color={C.textoMuted} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.texto }}>Sin resultados</Text>
                <TouchableOpacity
                  onPress={() => { setBusqueda(''); setFiltroNivel('TODOS'); }}
                  style={{ backgroundColor: C.verdeLight, borderWidth: 1, borderColor: C.verdeBorde, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.verde }}>Limpiar filtros</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Encabezado del ranking */}
      {!isLoading && ordenadas.length > 0 && (
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: isWeb ? 28 : 16, paddingTop: 16, paddingBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.textoMuted, letterSpacing: 0.6 }}>
              RANKING DE RIESGO
            </Text>
            <Text style={{ fontSize: 12, color: C.textoMuted }}>
              {ordenadas.length} {ordenadas.length === 1 ? 'comunidad' : 'comunidades'}
            </Text>
          </View>
          {RankingHeader}
        </View>
      )}
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [todas, busqueda, filtroNivel, isLoading, isError, ordenadas.length]);

  // ── ListFooterComponent: alertas + padding ────────────────────────────────
  const ListFooter = useMemo(() => (
    <View style={{ paddingHorizontal: isWeb ? 28 : 16, paddingTop: 16, paddingBottom: 80 }}>
      {criticas.length > 0 && (!hayFiltro || filtroNivel === 'TODOS' || filtroNivel === 'CRITICO') && (
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.rojoDot }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.texto }}>
              Alertas Críticas Activas
            </Text>
          </View>
          {criticas.map((com) => (
            <View key={com.id} style={{
              backgroundColor: C.blanco, borderLeftWidth: 4, borderLeftColor: C.rojoDot,
              borderWidth: 1, borderColor: C.borde, borderRadius: 10, padding: 14,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.rojoDot, letterSpacing: 0.5, marginBottom: 3 }}>ALERTA ROJA</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.texto }} numberOfLines={1}>{com.nombre}</Text>
                </View>
                <Text style={{ fontSize: 26, fontWeight: '800', color: C.rojoDot, fontFamily: 'monospace', marginLeft: 8 }}>
                  {com.irsuActual.toFixed(1)}
                </Text>
              </View>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#fef2f2', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7,
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: C.rojoDot }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.rojoText }}>ACCIÓN REQUERIDA</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [criticas, hayFiltro, filtroNivel]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/*
        Un único FlatList para toda la pantalla.
        - ListHeaderComponent: header, fórmula, mapa, buscador
        - data: las filas de ranking ya filtradas y ordenadas
        - ListFooterComponent: alertas críticas
        No hay ScrollView exterior → no hay VirtualizedList anidado.
      */}
      <FlatList<ComunidadResumen>
        data={isLoading ? [] : ordenadas}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        // Virtualización
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        contentContainerStyle={{ backgroundColor: C.bg }}
      />
    </View>
  );
}