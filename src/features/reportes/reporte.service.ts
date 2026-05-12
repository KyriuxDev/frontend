import { api } from "@/src/lib/axios";
import {
	ReportesRespuesta,
	ReporteDetalle,
	CrearReporteDto,
	CambiarEstadoDto,
  FotoFile,
} from "./reporte.types";
import { Platform } from "react-native";

export async function getReportes(params?: {
	comunidadId?: number;
	categoria?: string;
	estado?: string;
	page?: number;
	limit?: number;
}): Promise<ReportesRespuesta> {
	const { data } = await api.get<ReportesRespuesta>("/reportes", { params });
	return data;
}

export async function getReporteById(id: number): Promise<ReporteDetalle> {
	const { data } = await api.get<ReporteDetalle>(`/reportes/${id}`);
	return data;
}

export async function crearReporte(
	dto: CrearReporteDto,
): Promise<ReporteDetalle> {
	const payload = {
		titulo: dto.titulo,
		descripcion: dto.descripcion,
		gravedad: dto.gravedad,
		categoria: dto.categoria,
		fuente: dto.fuente,
		latitud: dto.latitud,
		longitud: dto.longitud,
		comunidadId: dto.comunidadId,
	};

	const { data } = await api.post<ReporteDetalle>("/reportes", payload);

	return data;
}

export async function subirFotosReporte(reporteId: number, fotos: FotoFile[]) {
  const formData = new FormData();

  fotos.forEach((foto) => {
    // IMPORTANTE: El cast a 'any' es necesario en TS para que acepte el objeto
    formData.append("fotos", {
      uri: Platform.OS === 'ios' ? foto.uri.replace('file://', '') : foto.uri,
      name: foto.name || `photo_${Date.now()}.jpg`,
      type: foto.type || 'image/jpeg',
    } as any);
  });

	const { data } = await api.post(`/reportes/${reporteId}/fotos`, formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});

	return data;
}

export async function eliminarReporte(id: number): Promise<void> {
	await api.delete(`/reportes/${id}`);
}

export async function cambiarEstadoReporte(
	id: number,
	dto: CambiarEstadoDto,
): Promise<ReporteDetalle> {
	const { data } = await api.patch<ReporteDetalle>(
		`/reportes/${id}/estado`,
		dto,
	);
	return data;
}
