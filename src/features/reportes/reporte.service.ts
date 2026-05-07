import { api } from '@/src/lib/axios';
import { ReportesRespuesta, ReporteDetalle, CrearReporteDto, CambiarEstadoDto } from './reporte.types';

export async function getReportes(params?: {
  comunidadId?: number;
  categoria?:   string;
  estado?:      string;
  page?:        number;
  limit?:       number;
}): Promise<ReportesRespuesta> {
  const { data } = await api.get<ReportesRespuesta>('/reportes', { params });
  return data;
}

export async function getReporteById(id: number): Promise<ReporteDetalle> {
  const { data } = await api.get<ReporteDetalle>(`/reportes/${id}`);
  return data;
}

export async function crearReporte(dto: CrearReporteDto): Promise<ReporteDetalle> {
  const { data } = await api.post<ReporteDetalle>('/reportes', dto);
  return data;
}

export async function eliminarReporte(id: number): Promise<void> {
  await api.delete(`/reportes/${id}`);
}


export async function cambiarEstadoReporte(
  id: number,
  dto: CambiarEstadoDto,
): Promise<ReporteDetalle> {
  const { data } = await api.patch<ReporteDetalle>(`/reportes/${id}/estado`, dto);
  return data;
}