import { useState, useCallback } from 'react';
import { useAuthStore } from '@/src/store/auth.store';

//const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
// Quita el /api/v1 del final si existe, para construir rutas limpias
const RAW = process.env.EXPO_PUBLIC_API_URL ?? '';
const BASE_URL = RAW.replace(/\/api\/v1\/?$/, '');


export function useProfile() {
  const { accessToken, usuario, login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const fetchPerfil = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/perfil/me`, { headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar perfil');
      await login(accessToken!, data);
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const actualizarNombre = useCallback(async (nombre: string) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/perfil/me`, {
        method:  'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al actualizar');
      await login(accessToken!, { ...usuario!, nombre });
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, usuario]);

  const subirAvatar = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: `avatar-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      const res  = await fetch(`${BASE_URL}/api/perfil/me/avatar`, {
        method:  'POST',
        headers: authHeader,
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al subir avatar');
      await login(accessToken!, { ...usuario!, avatarUrl: data.avatarUrl });
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, usuario]);

  const agregarComunidad = useCallback(async (comunidadId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/perfil/me/comunidades`, {
        method:  'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ comunidadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al agregar comunidad');
      await fetchPerfil();
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchPerfil]);

  const eliminarComunidad = useCallback(async (comunidadId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/perfil/me/comunidades/${comunidadId}`, {
        method:  'DELETE',
        headers: authHeader,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Error al eliminar');
      }
      await fetchPerfil();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchPerfil]);

  const setPrincipal = useCallback(async (comunidadId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/perfil/me/comunidades/${comunidadId}/principal`, {
        method:  'PATCH',
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cambiar principal');
      await fetchPerfil();
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchPerfil]);

  const buscarComunidades = useCallback(async (cp: string) => {
    try {
      const res  = await fetch(
        `${BASE_URL}/api/v1/codigos-postales?codigo=${cp}`,
        { headers: authHeader }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al buscar');
      return data;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, [accessToken]);

  return {
    usuario,
    loading,
    error,
    fetchPerfil,
    actualizarNombre,
    subirAvatar,
    agregarComunidad,
    eliminarComunidad,
    setPrincipal,
    buscarComunidades,
  };
}