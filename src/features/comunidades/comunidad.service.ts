import { api } from '@/src/lib/axios';
import {
  ComunidadesRespuesta,
  ComunidadResumen,
  CreateComunidadDto,
  UpdateComunidadDto,
} from './comunidad.types';

export async function getComunidades(params?: {
  status?:      string;
  municipioId?: number;
  page?:        number;
  limit?:       number;
}): Promise<ComunidadesRespuesta> {
  const { data } = await api.get<ComunidadesRespuesta>('/comunidades', { params });
  return data;
}

export async function getComunidadBySlug(slug: string): Promise<ComunidadResumen> {
  const { data } = await api.get<ComunidadResumen>(`/comunidades/${slug}`);
  return data;
}

export async function crearComunidad(dto: CreateComunidadDto): Promise<ComunidadResumen> {
  const { data } = await api.post<ComunidadResumen>('/comunidades', dto);
  return data;
}

export async function actualizarComunidad(
  slug: string,
  dto: UpdateComunidadDto,
): Promise<ComunidadResumen> {
  const { data } = await api.patch<ComunidadResumen>(`/comunidades/${slug}`, dto);
  return data;
}