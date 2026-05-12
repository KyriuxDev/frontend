import { memo, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { ComunidadResumen } from './comunidad.types';

const OAXACA_COORDS: { lat: number; lng: number }[] = [
  { lat: 17.0672, lng: -96.7201 }, { lat: 17.0693, lng: -96.7154 },
  { lat: 17.0721, lng: -96.7307 }, { lat: 17.0764, lng: -96.7261 },
  { lat: 17.0612, lng: -96.7241 }, { lat: 17.0843, lng: -96.7289 },
  { lat: 17.0580, lng: -96.7180 }, { lat: 17.0810, lng: -96.7140 },
  { lat: 17.0650, lng: -96.7380 }, { lat: 17.0900, lng: -96.7420 },
  { lat: 17.0550, lng: -96.7100 }, { lat: 17.0750, lng: -96.6980 },
  { lat: 17.0480, lng: -96.7320 }, { lat: 17.0920, lng: -96.7100 },
  { lat: 17.0600, lng: -96.7500 }, { lat: 17.0350, lng: -96.7200 },
  { lat: 17.0700, lng: -96.6850 }, { lat: 17.1050, lng: -96.7350 },
  { lat: 17.0450, lng: -96.7450 }, { lat: 17.0800, lng: -96.7500 },
  { lat: 17.0530, lng: -96.7050 }, { lat: 17.0980, lng: -96.7200 },
  { lat: 17.0420, lng: -96.7100 }, { lat: 17.0660, lng: -96.7550 },
  { lat: 17.0870, lng: -96.7050 }, { lat: 17.0320, lng: -96.7350 },
  { lat: 17.0740, lng: -96.6750 }, { lat: 17.1100, lng: -96.7450 },
  { lat: 17.0380, lng: -96.7480 }, { lat: 17.0820, lng: -96.7600 },
];

const MAX_MARKERS = 30;

function pinColor(irsu: number) {
  if (irsu > 100) return '#dc2626';
  if (irsu > 50)  return '#d97706';
  return '#16a34a';
}
function irsuBg(irsu: number)      { return irsu > 100 ? '#fee2e2' : irsu > 50 ? '#fef3c7' : '#dcfce7'; }
function irsuTextCol(irsu: number) { return irsu > 100 ? '#991b1b' : irsu > 50 ? '#92400e' : '#166534'; }
function irsuLabel(irsu: number)   { return irsu > 100 ? 'CRÍTICO' : irsu > 50 ? 'ALERTA'  : 'ESTABLE'; }

const ComunidadCallout = memo(function ComunidadCallout({ com }: { com: ComunidadResumen }) {
  const color = pinColor(com.irsuActual);
  return (
    <Callout tooltip>
      <View style={s.callout}>
        <Text style={s.calloutNombre} numberOfLines={2}>{com.nombre}</Text>
        <Text style={s.calloutMunicipio}>{com.municipio.nombre}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color }}>{com.irsuActual.toFixed(1)}</Text>
          <View style={{ backgroundColor: irsuBg(com.irsuActual), borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: irsuTextCol(com.irsuActual) }}>
              {irsuLabel(com.irsuActual)}
            </Text>
          </View>
        </View>
      </View>
    </Callout>
  );
});

const ComunidadMarker = memo(function ComunidadMarker({
  com, onPress,
}: {
  com: ComunidadResumen & { coord: { lat: number; lng: number } };
  onPress: () => void;
}) {
  return (
    <Marker
      coordinate={{ latitude: com.coord.lat, longitude: com.coord.lng }}
      pinColor={pinColor(com.irsuActual)}
      tracksViewChanges={false}
      onPress={onPress}
    >
      <ComunidadCallout com={com} />
    </Marker>
  );
});

const Leyenda = memo(function Leyenda() {
  return (
    <View style={s.leyenda}>
      {[
        { color: '#dc2626', label: '> 100  Crítico' },
        { color: '#d97706', label: '50–100  Alerta' },
        { color: '#16a34a', label: '< 50   Estable' },
      ].map(({ color, label }) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
          <Text style={{ fontSize: 10, color: '#4a5e4a', fontWeight: '500' }}>{label}</Text>
        </View>
      ))}
    </View>
  );
});

type Filtro = 'TODOS' | 'CRITICO' | 'ALERTA' | 'ESTABLE';
function irsuFiltro(irsu: number): Filtro {
  if (irsu > 100) return 'CRITICO';
  if (irsu > 50)  return 'ALERTA';
  return 'ESTABLE';
}
const FILTROS_CFG: { label: string; value: Filtro; color: string }[] = [
  { label: 'Todos',   value: 'TODOS',   color: '#1d4e32' },
  { label: 'Crítico', value: 'CRITICO', color: '#dc2626' },
  { label: 'Alerta',  value: 'ALERTA',  color: '#d97706' },
  { label: 'Estable', value: 'ESTABLE', color: '#16a34a' },
];

export default memo(function MapaComunidades({ comunidades }: { comunidades: ComunidadResumen[] }) {
  const mapRef              = useRef<MapView>(null);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [selId, setSelId]   = useState<number | null>(null);

  const conCoords = useMemo(() =>
    [...comunidades]
      .sort((a, b) => b.irsuActual - a.irsuActual)
      .slice(0, MAX_MARKERS)
      .map((com, idx) => ({ ...com, coord: OAXACA_COORDS[idx % OAXACA_COORDS.length] })),
  [comunidades]);

  const visibles = useMemo(() =>
    filtro === 'TODOS' ? conCoords : conCoords.filter((c) => irsuFiltro(c.irsuActual) === filtro),
  [conCoords, filtro]);

  const conteos = useMemo(() => ({
    TODOS:   conCoords.length,
    CRITICO: conCoords.filter((c) => irsuFiltro(c.irsuActual) === 'CRITICO').length,
    ALERTA:  conCoords.filter((c) => irsuFiltro(c.irsuActual) === 'ALERTA').length,
    ESTABLE: conCoords.filter((c) => irsuFiltro(c.irsuActual) === 'ESTABLE').length,
  }), [conCoords]);

  function centrarEn(lat: number, lng: number, id: number) {
    setSelId(id);
    mapRef.current?.animateToRegion(
      { latitude: lat - 0.003, longitude: lng, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      400,
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={s.filtrosWrap} pointerEvents="box-none">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
          keyboardShouldPersistTaps="handled"
        >
          {FILTROS_CFG.map((f) => {
            const activo = filtro === f.value;
            return (
              <TouchableOpacity key={f.value}
                onPress={() => { setFiltro(f.value); setSelId(null); }}
                style={{
                  borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
                  backgroundColor: activo ? f.color : 'rgba(255,255,255,0.95)',
                  borderWidth: 1, borderColor: activo ? f.color : '#e8ede8',
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: activo ? '#fff' : '#4a5e4a' }}>
                  {f.label} ({conteos[f.value]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ latitude: 17.0732, longitude: -96.7266, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
        pitchEnabled={false}
        rotateEnabled={false}
        moveOnMarkerPress={false}
      >
        {visibles.map((com) => (
          <ComunidadMarker key={com.id} com={com}
            onPress={() => centrarEn(com.coord.lat, com.coord.lng, com.id)}
          />
        ))}
      </MapView>

      <Leyenda />
      <View style={s.contador}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#1d4e32' }}>
          {visibles.length}/{comunidades.length}
        </Text>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  filtrosWrap: { position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 },
  leyenda: {
    position: 'absolute', bottom: 14, left: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, gap: 5,
    borderWidth: 1, borderColor: '#e8ede8', elevation: 4,
  },
  contador: {
    position: 'absolute', bottom: 14, right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#b8e0c5', elevation: 3,
  },
  callout: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    minWidth: 180, maxWidth: 240, borderWidth: 1, borderColor: '#e8ede8', elevation: 6,
  },
  calloutNombre:    { fontSize: 15, fontWeight: '700', color: '#0f1f0f', lineHeight: 20 },
  calloutMunicipio: { fontSize: 12, color: '#9aaa9a', marginTop: 2 },
});