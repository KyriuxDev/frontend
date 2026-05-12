import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useReportes } from './reporte.queries';
import { ReporteResumen, Categoria, EstadoReporte } from './reporte.types';
import { formatearFechaCorta } from '@/src/utils/formatDate';
import { getImageUrl } from '@/src/utils/getImageUrl';
import { Ionicons } from '@expo/vector-icons';

const FILTROS: { label: string; value: Categoria | 'TODOS' }[] = [
  { label: 'Todos',           value: 'TODOS' },
  { label: 'Infraestructura', value: 'INFRAESTRUCTURA' },
  { label: 'Vialidad',        value: 'VIALIDAD' },
  { label: 'Bloqueos',        value: 'BLOQUEOS' },
  { label: 'Seguridad',       value: 'SEGURIDAD' },
];

function colorCategoria(categoria: Categoria): { bg: string; text: string } {
  switch (categoria) {
    case 'INFRAESTRUCTURA': return { bg: '#dbeafe', text: '#1d4ed8' };
    case 'VIALIDAD':        return { bg: '#fef9c3', text: '#854d0e' };
    case 'BLOQUEOS':        return { bg: '#fce7f3', text: '#9d174d' };
    case 'SEGURIDAD':       return { bg: '#dcfce7', text: '#15803d' };
  }
}

function colorEstado(estado: EstadoReporte): { bg: string; text: string } {
  switch (estado) {
    case 'PENDIENTE':   return { bg: '#fef3c7', text: '#92400e' };
    case 'EN_PROCESO':  return { bg: '#dbeafe', text: '#1e40af' };
    case 'RESUELTO':    return { bg: '#dcfce7', text: '#166634' };
    case 'RECHAZADO':   return { bg: '#fee2e2', text: '#991b1b' };
  }
}

function labelEstado(estado: EstadoReporte): string {
  switch (estado) {
    case 'PENDIENTE':   return 'PENDIENTE';
    case 'EN_PROCESO':  return 'EN PROCESO';
    case 'RESUELTO':    return 'RESUELTO';
    case 'RECHAZADO':   return 'RECHAZADO';
  }
}

function Estrellas({ gravedad }: { gravedad: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 14, color: i <= gravedad ? '#f59e0b' : '#cbd5e1' }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function CardReporte({ reporte }: { reporte: ReporteResumen }) {
  const router = useRouter();
  const catColor    = colorCategoria(reporte.categoria);
  const estadoColor = colorEstado(reporte.estado);
  const primeraFotoUrl = getImageUrl(reporte.fotos?.[0]?.url);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/reportes/${reporte.id}`)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {primeraFotoUrl && (
        <Image
          source={{ uri: primeraFotoUrl }}
          style={{ width: '100%', height: 128 }}
          resizeMode="cover"
        />
      )}

      <View style={{ padding: 16, gap: 8 }}>
        {/* Chips */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: catColor.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: catColor.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {reporte.categoria}
            </Text>
          </View>
          <View style={{ backgroundColor: estadoColor.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: estadoColor.text }}>
              {labelEstado(reporte.estado)}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0b1c30' }}>
          {reporte.titulo}
        </Text>

        <Text style={{ fontSize: 12, color: '#737686' }}>
          📍 {reporte.comunidad.nombre}
        </Text>

        <Estrellas gravedad={reporte.gravedad} />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: '#737686' }}>
            {formatearFechaCorta(reporte.createdAt)}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1d4e32' }}>
            Ver detalle →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ListaReportes() {
  const [filtroActivo, setFiltroActivo] = useState<Categoria | 'TODOS'>('TODOS');

  const { data, isLoading, isError, refetch } = useReportes({
    categoria: filtroActivo === 'TODOS' ? undefined : filtroActivo,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 46,
          paddingBottom: 12,
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#1d4e32', letterSpacing: -0.5 }}>
          IRSU
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={{ padding: 8, borderRadius: 999 }}>
            <Text style={{ fontSize: 20 }}><Ionicons name="search-outline" size={20} color="#737686" /></Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 8, borderRadius: 999 }}>
            <Text style={{ fontSize: 20 }}><Ionicons name="notifications-outline" size={20} color="#64748b" /></Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#0b1c30', letterSpacing: -0.5 }}>
            Lista de Reportes
          </Text>
          <Text style={{ fontSize: 16, color: '#434655', marginTop: 4, marginBottom: 16 }}>
            Revisa el estado de las incidencias en tu comunidad.
          </Text>

          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 8, paddingRight: 20 }}
          >
            {FILTROS.map((f) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFiltroActivo(f.value)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: filtroActivo === f.value ? '#1d4e32' : '#e5eeff',
                  borderWidth: filtroActivo === f.value ? 0 : 1,
                  borderColor: '#c3c6d7',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: filtroActivo === f.value ? '#ffffff' : '#434655',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoading && (
            <ActivityIndicator size="large" color="#1d4e32" style={{ marginTop: 40 }} />
          )}

          {isError && (
            <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
              <Text style={{ fontSize: 16, color: '#737686' }}>
                No se pudieron cargar los reportes
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{
                  backgroundColor: '#1d4e32',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !isError && data?.data.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 40 }}></Text>
              <Text style={{ fontSize: 16, color: '#737686', marginTop: 8 }}>
                No hay reportes todavía
              </Text>
            </View>
          )}

          {!isLoading && data?.data && (
            <View style={{ gap: 12, paddingBottom: 120 }}>
              {data.data.map((reporte) => (
                <CardReporte key={reporte.id} reporte={reporte} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Link href="/(main)/reportes/crear" asChild>
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 90,
            right: 24,
            width: 56,
            height: 56,
            backgroundColor: '#1d4e32',
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 28, color: '#fff', lineHeight: 32 }}>+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}