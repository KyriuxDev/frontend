import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getComunidades,
  crearComunidad,
  actualizarComunidad,
} from './comunidad.service';
import { CreateComunidadDto, UpdateComunidadDto } from './comunidad.types';

export function useComunidades(params?: {
  status?:      string;
  municipioId?: number;
  page?:        number;
}) {
  return useQuery({
    queryKey: ['comunidades', params],
    queryFn:  () => getComunidades({ ...params, limit: 100 }),
  });
}

export function useCrearComunidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateComunidadDto) => crearComunidad(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['comunidades'] }),
  });
}

export function useActualizarComunidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, dto }: { slug: string; dto: UpdateComunidadDto }) =>
      actualizarComunidad(slug, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comunidades'] }),
  });
}