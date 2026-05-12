import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { login, registro } from './auth.service';
import { LoginInput, RegistroInput } from './auth.schema';

const ROLES_ADMIN    = ['SUPER_ADMIN', 'ADMIN', 'COORDINADOR'];
const ROLES_OPERADOR = ['OPERADOR'];

function getRutaPorRol(rol: string): string {
  if (ROLES_OPERADOR.includes(rol)) return '/(main)/cuadrillas';
  if (ROLES_ADMIN.includes(rol))    return '/(main)/admin';
  return '/(main)/reportes';
}

export function useLogin() {
  const loginStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginInput) => login(data),
    onSuccess: async (respuesta) => {
      await loginStore(respuesta.token, respuesta.usuario);
      router.replace(getRutaPorRol(respuesta.usuario.rol) as any);
    },
  });
}

export function useRegistro() {
  const loginStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegistroInput) => registro(data),
    onSuccess: async (respuesta) => {
      await loginStore(respuesta.token, respuesta.usuario);
      router.replace(getRutaPorRol(respuesta.usuario.rol) as any);
    },
  });
}