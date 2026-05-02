export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  }).format(new Date(fecha));
}

export function formatearFechaCorta(fecha: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  }).format(new Date(fecha));
}