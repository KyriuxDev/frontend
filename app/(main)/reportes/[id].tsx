import { useLocalSearchParams } from 'expo-router';
import { DetalleReporte } from '@/src/features/reportes/DetalleReporte';

export default function DetalleReporteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetalleReporte id={Number(id)} />;
}