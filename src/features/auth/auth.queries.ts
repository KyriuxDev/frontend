import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { login, registro } from './auth.service';
import { LoginInput, RegistroInput } from './auth.schema';

export function useLogin() {
  const router    = useRouter();
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: LoginInput) => login(data),
    onSuccess: async (respuesta) => {
      await loginStore(respuesta.token);
      router.replace('/(main)/reportes');
    },
  });
}

export function useRegistro() {
  const router     = useRouter();
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (data: RegistroInput) => registro(data),
    onSuccess: async (respuesta) => {
      await loginStore(respuesta.token);
      router.replace('/(main)/reportes');
    },
  });
}