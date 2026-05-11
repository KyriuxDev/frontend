import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { login, registro } from './auth.service';
import { LoginInput, RegistroInput } from './auth.schema';

export function useLogin() {
  const loginStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginInput) => login(data),
    onSuccess: async (respuesta) => {
      await loginStore(respuesta.token, respuesta.usuario);
      router.replace('/(main)/reportes');
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
      router.replace('/(main)/reportes');
    },
  });
}