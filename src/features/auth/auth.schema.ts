import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registroSchema = z.object({
  email:    z.string().email('Email inválido'),
  nombre:   z.string().min(1, 'El nombre es requerido').max(100).optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type LoginInput   = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;