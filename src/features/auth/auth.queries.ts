import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth.store';
import { login, registro } from './auth.service';
import { LoginInput, RegistroInput } from './auth.schema';

export function useLogin() {
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: LoginInput) => login(data),
    onSuccess: async (respuesta) => {
      // Solo actualiza el store. index.tsx reacciona al cambio y redirige.
      await loginStore(respuesta.token, respuesta.usuario);
    },
  });
}

export function useRegistro() {
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: RegistroInput) => registro(data),
    onSuccess: async (respuesta) => {
      await loginStore(respuesta.token, respuesta.usuario);
    },
  });
}