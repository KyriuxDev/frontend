// src/features/admin/dashboard.queries.ts
import { useQuery } from '@tanstack/react-query';
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