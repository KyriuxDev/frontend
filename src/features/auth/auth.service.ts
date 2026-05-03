import { api } from '@/src/lib/axios';
import { AuthRespuesta } from './auth.types';
import { LoginInput, RegistroInput } from './auth.schema';

export async function login(data: LoginInput): Promise<AuthRespuesta> {
  const respuesta = await api.post<AuthRespuesta>('/auth/login', data);
  return respuesta.data;
}

export async function registro(data: RegistroInput): Promise<AuthRespuesta> {
  const respuesta = await api.post<AuthRespuesta>('/auth/register', data);
  return respuesta.data;
}