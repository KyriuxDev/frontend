import { ROLES } from '@/src/constants/app.constants';

export type Rol = typeof ROLES[keyof typeof ROLES];

export interface ComunidadUsuario {
  id:           number;
  comunidadId:  number;
  nombre:       string;
  slug:         string;
  esPrincipal:  boolean;
  irsuActual:   number;
  color:        string;
  codigoPostal: string | null;
  colonia:      string | null;
}

export interface Usuario {
  id:          number;
  email:       string;
  nombre:      string | null;
  avatarUrl:   string | null;
  rol:         Rol;
  comunidades: ComunidadUsuario[];
}

export interface AuthRespuesta {
  token:   string;
  usuario: Usuario;
}