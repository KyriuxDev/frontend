import { ROLES } from '@/src/constants/app.constants';

export type Rol = typeof ROLES[keyof typeof ROLES];

export interface Usuario {
  id:     number;
  email:  string;
  nombre: string | null;
  rol:    Rol;
}

export interface AuthRespuesta {
  token:   string;
  usuario: Usuario;
}