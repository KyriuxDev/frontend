import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/axios';

export function useOaxacaComunidades(status?: string) {
  return useQuery({
    queryKey: ['comunidades-oaxaca', status],
    queryFn: () =>
      api.get('/comunidades', {
        params: {
          municipioId: 1082, // ID de Oaxaca de Juárez
          limit: 1000,
          ...(status && { status }),
        },
      }).then(r => r.data.data ?? []),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOaxacaMunicipio() {
  return useQuery({
    queryKey: ['municipio-oaxaca'],
    queryFn: () => api.get('/municipios/clave/20067').then(r => r.data),
    staleTime: Infinity,
  });
}