export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME ?? 'IRSU App';

export const ROLES = {
  SUPER_ADMIN:  'SUPER_ADMIN',
  ADMIN:        'ADMIN',
  COORDINADOR:  'COORDINADOR',
  USUARIO:      'USUARIO',
} as const;

export const CATEGORIAS = {
  'BACHES Y PAVIMENTO': 'BACHES Y PAVIMENTO',
  SEÑALIZACIÓN:        'SEÑALIZACIÓN',
  BLOQUEOS:        'BLOQUEOS',
  SEGURIDAD:       'SEGURIDAD',
} as const;

export const ESTADOS_REPORTE = {
  PENDIENTE:  'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  RESUELTO:   'RESUELTO',
  RECHAZADO:  'RECHAZADO',
} as const;

export const PAGINACION = {
  PAGINA_DEFAULT:  1,
  LIMITE_DEFAULT:  20,
} as const;