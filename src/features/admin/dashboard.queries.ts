import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/axios';

export function useDashboardStats(periodo: '7D' | '30D' | '90D') {
  return useQuery({
    queryKey: ['dashboard', 'stats', periodo],
    queryFn: () =>
      api
        .get('/irsu/stats/dashboard', { params: { periodo } })
        .then(r => r.data as {
          serie: { fecha: string; irsu: number }[];
          kpis:  {
            totalReportes: number;
            pendientes:    number;
            enProceso:     number;
            resueltos:     number;
          };
        }),
  });
}

export function useReporteStats() {
  return useQuery({
    queryKey: ['reportes', 'stats'],
    queryFn: () =>
      api.get('/reportes/stats').then(r => r.data),
  });
}

export function useRecalcularIrsu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post('/irsu/recalcular/todas').then(r => r.data as {
        total:    number;
        exitosos: number;
        fallidos: number;
      }),
    onSuccess: () => {
      // Refresca el dashboard automáticamente tras recalcular
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}