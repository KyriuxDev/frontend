import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/axios';

export type EstadoAsignacion = 'ASIGNADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';

export function useAsignaciones(filtros: { cuadrillaId?: number; estado?: EstadoAsignacion }) {
  return useQuery({
    queryKey: ['asignaciones', filtros],
    queryFn: () =>
      api
        .get('/cuadrillas/asignaciones/lista', { params: { ...filtros, limit: 100 } })
        .then((r) => r.data),
  });
}

export function useCambiarEstadoAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      estado,
      nota,
    }: {
      id: number;
      estado: EstadoAsignacion;
      nota?: string;
    }) =>
      api
        .patch(`/cuadrillas/asignaciones/${id}/estado`, { estado, nota })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones'] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
}