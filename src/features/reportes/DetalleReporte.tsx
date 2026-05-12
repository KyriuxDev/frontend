import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReporte, useVotos, useVotar, useQuitarVoto } from './reporte.queries';
import { EstadoReporte, Categoria } from './reporte.types';
import { formatearFecha } from '@/src/utils/formatDate';
import { useAuthStore } from '@/src/store/auth.store';
import { getImageUrl } from '@/src/utils/getImageUrl';

const { width } = Dimensions.get('window');

function colorCategoria(categoria: Categoria) {
  switch (categoria) {
    case 'INFRAESTRUCTURA': return { bg: '#dbeafe', text: '#1d4ed8' };
    case 'VIALIDAD':        return { bg: '#fef9c3', text: '#854d0e' };
    case 'BLOQUEOS':        return { bg: '#fce7f3', text: '#9d174d' };
    case 'SEGURIDAD':       return { bg: '#dcfce7', text: '#15803d' };
  }
}

function labelEstado(estado: EstadoReporte): string {
  switch (estado) {
    case 'PENDIENTE':  return 'Reporte Recibido';
    case 'EN_PROCESO': return 'En Proceso';
    case 'RESUELTO':   return 'Resuelto';
    case 'RECHAZADO':  return 'Rechazado';
  }
}

function colorEstadoPunto(estado: EstadoReporte, actual: EstadoReporte) {
  const orden: EstadoReporte[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO'];
  const idxActual = orden.indexOf(actual);
  const idxEstado = orden.indexOf(estado);
  if (idxEstado <= idxActual) return '#1d4e32';
  return '#c3c6d7';
}

function Estrellas({ gravedad }: { gravedad: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 18, color: i <= gravedad ? '#f59e0b' : '#cbd5e1' }}>
          ★
        </Text>
      ))}
    </View>
  );
}

interface Props {
  id: number;
}

export function DetalleReporte({ id }: Props) {
  const router          = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: reporte, isLoading, isError } = useReporte(id);
  const { data: votos }                        = useVotos(id);
  const { mutate: votar,      isPending: votando }      = useVotar(id);
  const { mutate: quitarVoto, isPending: quitandoVoto } = useQuitarVoto(id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9ff' }}>
        <ActivityIndicator size="large" color="#1d4e32" />
      </View>
    );
  }

  if (isError || !reporte) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9ff' }}>
        <Text style={{ fontSize: 16, color: '#737686' }}>No se pudo cargar el reporte</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#1d4e32', fontWeight: '600' }}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catColor   = colorCategoria(reporte.categoria);
  const yaVote     = votos?.yaVote ?? false;
  const totalVotos = votos?.total ?? reporte.voteCount;

  const estadosTimeline: EstadoReporte[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO'];

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 52,
            paddingBottom: 12,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontSize: 22, color: '#64748b' }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1d4e32' }}>
              Detalle de Reporte
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={{ fontSize: 20, color: '#64748b' }}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Carrusel de fotos */}
        {reporte.fotos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width, height: width * 0.75 }}
          >
            {reporte.fotos.map((foto) => {
              const fotoUrl = getImageUrl(foto.url);
              return fotoUrl ? (
                <Image
                  key={foto.id}
                  source={{ uri: fotoUrl }}
                  style={{ width, height: width * 0.75 }}
                  resizeMode="cover"
                />
              ) : null;
            })}
          </ScrollView>
        ) : (
          <View
            style={{
              width,
              height: width * 0.5,
              backgroundColor: '#e5eeff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={{ color: '#737686', marginTop: 8 }}>Sin fotos</Text>
          </View>
        )}

        {/* Indicador de fotos */}
        {reporte.fotos.length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#ffffff' }}>
            {reporte.fotos.map((f, i) => (
              <View
                key={f.id}
                style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: i === 0 ? '#1d4e32' : '#cbd5e1',
                }}
              />
            ))}
          </View>
        )}

        <View style={{ paddingHorizontal: 20, marginTop: reporte.fotos.length > 1 ? 0 : -24 }}>

          {/* Card principal */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
              marginBottom: 12,
            }}
          >
            {/* Chips */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ backgroundColor: catColor.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: catColor.text }}>
                  {reporte.categoria}
                </Text>
              </View>
              <Estrellas gravedad={reporte.gravedad} />
            </View>

            {/* Título */}
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#0b1c30', letterSpacing: -0.5, marginBottom: 4 }}>
              {reporte.titulo}
            </Text>

            {/* Reportado por */}
            <Text style={{ fontSize: 14, color: '#737686', marginBottom: 16 }}>
              Reportado {formatearFecha(reporte.createdAt)}{' '}
              {reporte.usuario ? `por ${reporte.usuario.nombre ?? reporte.usuario.email}` : '(anónimo)'}
            </Text>

            {/* Botón votar */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (!isAuthenticated) return;
                  yaVote ? quitarVoto() : votar();
                }}
                disabled={votando || quitandoVoto || !isAuthenticated}
                style={{
                  flex: 1,
                  backgroundColor: yaVote ? '#e5eeff' : '#1d4e32',
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>👍</Text>
                <Text style={{ color: yaVote ? '#1d4e32' : '#ffffff', fontWeight: '600', fontSize: 14 }}>
                  {yaVote ? 'Votado' : 'Votar'} ({totalVotos})
                </Text>
              </TouchableOpacity>
            </View>

            {!isAuthenticated && (
              <Text style={{ fontSize: 11, color: '#737686', textAlign: 'center', marginTop: 8 }}>
                Inicia sesión para votar
              </Text>
            )}
          </View>

          {/* Descripción */}
          {reporte.descripcion && (
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 2,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#0b1c30', marginBottom: 8 }}>
                Descripción del Problema
              </Text>
              <Text style={{ fontSize: 16, color: '#434655', lineHeight: 24 }}>
                {reporte.descripcion}
              </Text>

              <View
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <View style={{ backgroundColor: '#dbeafe', padding: 8, borderRadius: 999 }}>
                  <Text style={{ fontSize: 16 }}>⚠️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30' }}>
                    Gravedad: {reporte.gravedad}/5
                  </Text>
                  <Text style={{ fontSize: 12, color: '#737686' }}>
                    Comunidad: {reporte.comunidad.nombre}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Timeline historial */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
              marginBottom: 100,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#0b1c30', marginBottom: 16 }}>
              Historial de Estado
            </Text>

            {estadosTimeline.map((estado, idx) => {
              const color   = colorEstadoPunto(estado, reporte.estado);
              const activo  = reporte.estado === estado;
              const entrada = reporte.historial.find((h) => h.estadoNuevo === estado);

              return (
                <View key={estado} style={{ flexDirection: 'row', gap: 12, marginBottom: idx < estadosTimeline.length - 1 ? 16 : 0 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: color,
                        ...(activo && {
                          shadowColor: color,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.5,
                          shadowRadius: 4,
                          elevation: 3,
                        }),
                      }}
                    />
                    {idx < estadosTimeline.length - 1 && (
                      <View style={{ width: 1, flex: 1, backgroundColor: '#e2e8f0', marginTop: 4 }} />
                    )}
                  </View>
                  <View style={{ flex: 1, opacity: color === '#c3c6d7' ? 0.5 : 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0b1c30' }}>
                      {labelEstado(estado)}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#737686' }}>
                      {entrada ? formatearFecha(entrada.createdAt) : 'Pendiente'}
                    </Text>
                    {entrada?.nota && (
                      <Text style={{ fontSize: 12, color: '#434655', marginTop: 2 }}>
                        {entrada.nota}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}