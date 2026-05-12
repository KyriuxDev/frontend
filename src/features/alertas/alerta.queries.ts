import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/axios';

export type NivelAlerta  = 'AMARILLA' | 'ROJA';
export type EstadoAlerta = 'ACTIVA' | 'EN_ATENCION' | 'CERRADA';

export function useAlertas(filtros?: {
  nivel?:       NivelAlerta;
  estado?:      EstadoAlerta;
  comunidadId?: number;
  page?:        number;
}) {
  return useQuery({
    queryKey: ['alertas', filtros],
    queryFn: () =>
      api
        .get('/alertas', { params: { ...filtros, limit: 50 } })
        .then((r) => r.data),
  });
}

export function useTomarAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.patch(`/alertas/${id}/tomar`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas'] }),
  });
}

export function useCerrarAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nota }: { id: number; nota?: string }) =>
      api.patch(`/alertas/${id}/cerrar`, { nota }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas'] }),
  });
}