import { z } from 'zod';
import { CATEGORIAS } from '@/src/constants/app.constants';

export const crearReporteSchema = z.object({
  titulo:      z.string().trim().min(3, 'Mínimo 3 caracteres').max(120),
  descripcion: z.string().trim().max(2000).optional(),
  gravedad:    z.number().int().min(1).max(5),
  categoria:   z.enum(['INFRAESTRUCTURA', 'VIALIDAD', 'BLOQUEOS', 'SEGURIDAD']),
  latitud:     z.number(),
  longitud:    z.number(),
  comunidadId: z.number().int().positive(),
  fotos:       z.array(z.string().url()).max(10).optional(),
});

export type CrearReporteInput = z.infer<typeof crearReporteSchema>;