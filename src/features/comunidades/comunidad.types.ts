export type EstadoComunidad = 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO' | 'SUSPENDIDO';

export interface ComunidadResumen {
  id:         number;
  nombre:     string;
  slug:       string;
  status:     EstadoComunidad;
  irsuActual: number;
  color:      string;
  logoUrl:    string | null;
  municipio:  { id: number; nombre: string };
}

export interface ComunidadesRespuesta {
  data: ComunidadResumen[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateComunidadDto {
  nombre:      string;
  municipioId: number;
  cpId?:       number;
  color?:      string;
}

export interface UpdateComunidadDto {
  nombre?:  string;
  color?:   string;
  status?:  EstadoComunidad;
}