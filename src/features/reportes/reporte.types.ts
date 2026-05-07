export type Categoria = 'INFRAESTRUCTURA' | 'VIALIDAD' | 'BLOQUEOS' | 'SEGURIDAD';
export type EstadoReporte = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';
export type FuenteReporte = 'APP_MOVIL' | 'WEB' | 'TWITTER' | 'FACEBOOK';

export interface ReporteResumen {
  id:        number;
  titulo:    string;
  gravedad:  number;
  categoria: Categoria;
  estado:    EstadoReporte;
  fuente:    FuenteReporte;
  latitud:   number;
  longitud:  number;
  voteCount: number;
  comunidad: { id: number; nombre: string; slug: string };
  usuario:   { id: number; nombre: string | null; email: string } | null;
  fotos:     { id: number; url: string }[];
  createdAt: string;
}

export interface ReporteDetalle extends ReporteResumen {
  descripcion:  string | null;
  sincronizado: boolean;
  historial: {
    id:             number;
    estadoAnterior: EstadoReporte | null;
    estadoNuevo:    EstadoReporte;
    nota:           string | null;
    createdAt:      string;
    usuario:        { id: number; nombre: string | null; email: string };
  }[];
}

export interface CrearReporteDto {
  titulo:       string;
  descripcion?: string;
  gravedad:     number;
  categoria:    Categoria;
  fuente:       FuenteReporte;
  latitud:      number;
  longitud:     number;
  comunidadId:  number;
  fotos?:       string[];
  sincronizado?: boolean;
}

export interface CambiarEstadoDto {
  estado: EstadoReporte;
  nota?:  string;
}

export interface PaginacionMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface ReportesRespuesta {
  data: ReporteResumen[];
  meta: PaginacionMeta;
}