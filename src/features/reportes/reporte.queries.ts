import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReportes, getReporteById, crearReporte, eliminarReporte } from './reporte.service';
import { CrearReporteDto } from './reporte.types';

export function useReportes(params?: {
  comunidadId?: number;
  categoria?:   string;
  estado?:      string;
  page?:        number;
}) {
  return useQuery({
    queryKey: ['reportes', params],
    queryFn:  () => getReportes(params),
  });
}

export function useReporte(id: number) {
  return useQuery({
    queryKey: ['reportes', id],
    queryFn:  () => getReporteById(id),
    enabled:  !!id,
  });
}

export function useCrearReporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearReporteDto) => crearReporte(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['reportes'] }),
  });
}

export function useEliminarReporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarReporte(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['reportes'] }),
  });
}