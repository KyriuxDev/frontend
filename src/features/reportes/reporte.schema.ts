import { z } from 'zod';
import { CATEGORIAS } from '@/src/constants/app.constants';

export const crearReporteSchema = z.object({
  titulo: z.string().trim().min(3).max(120),

  descripcion: z.string().trim().max(2000).optional(),

  gravedad: z.number().int().min(1).max(5),

  categoria: z.enum([
    'INFRAESTRUCTURA',
    'VIALIDAD',
    'BLOQUEOS',
    'SEGURIDAD'
  ]),

  latitud: z.number(),

  longitud: z.number(),

  comunidadId: z.number().int().positive(),
});

export type CrearReporteInput = z.infer<typeof crearReporteSchema>;