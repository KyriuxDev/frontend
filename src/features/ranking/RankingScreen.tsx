import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRanking } from './ranking.queries';
import { getImageUrl } from '@/src/utils/getImageUrl';

const MEDALLAS = ['🥇', '🥈', '🥉'];

export function RankingScreen() {
  const { data, isLoading, isError } = useRanking();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9ff' }}>
        <ActivityIndicator size="large" color="#1d4e32" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9ff' }}>
        <Text style={{ color: '#737686' }}>No se pudo cargar el ranking</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f9ff' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 52, paddingBottom: 32 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1d4e32', marginBottom: 4 }}>
          Ranking
        </Text>
        <Text style={{ fontSize: 14, color: '#737686', marginBottom: 24 }}>
          Ciudadanos con más reportes
        </Text>

        {data.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: item.posicion <= 3 ? '#1d4e32' : '#e2e8f0',
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 24, width: 36 }}>
              {MEDALLAS[item.posicion - 1] ?? `#${item.posicion}`}
            </Text>

            {item.avatarUrl ? (
              <Image
                source={{ uri: getImageUrl(item.avatarUrl) ?? '' }}
                style={{ width: 44, height: 44, borderRadius: 22, marginHorizontal: 12 }}
              />
            ) : (
              <View style={{
                width: 44, height: 44, borderRadius: 22, marginHorizontal: 12,
                backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18, color: '#1d4e32' }}>
                  {item.nombre?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0b1c30' }}>
                {item.nombre ?? 'Anónimo'}
              </Text>
              <Text style={{ fontSize: 13, color: '#737686' }}>
                {item.totalReportes} reporte{item.totalReportes !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}