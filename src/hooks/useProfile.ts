import { useState, useCallback } from 'react';
import { useAuthStore } from '@/src/store/auth.store';
import { api } from '@/src/lib/axios';

const RAW = process.env.EXPO_PUBLIC_API_URL ?? '';
// Strips /api/v1 — perfil routes live at /api/perfil, not /api/v1/perfil
const BASE_URL = RAW.replace(/\/api\/v1\/?$/, '');

export function useProfile() {
  const { accessToken, usuario, login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ─── Perfil ───────────────────────────────────────────────────────────────

  const fetchPerfil = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`${BASE_URL}/api/perfil/me`);
      await login(accessToken!, data);
      return data;
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const actualizarNombre = useCallback(async (nombre: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.patch(`${BASE_URL}/api/perfil/me`, { nombre });
      await login(accessToken!, { ...usuario!, nombre });
      return data;
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, usuario]);

  // ─── Avatar ───────────────────────────────────────────────────────────────

  const subirAvatar = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    try {
      const ext  = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mime =
        ext === 'png'  ? 'image/png'  :
        ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: `avatar-${Date.now()}.${ext}`,
        type: mime,
      } as any);

      await api.post(
        `${BASE_URL}/api/perfil/me/avatar`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      // Re-fetch the full profile from the DB so the UI reflects what was
      // actually saved — this is the source of truth instead of guessing
      // the returned avatarUrl and updating the store manually.
      await fetchPerfil();
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e.message ?? 'Error al subir avatar';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchPerfil]);

  // ─── Comunidades ──────────────────────────────────────────────────────────

  const agregarComunidad = useCallback(async (comunidadId: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(
        `${BASE_URL}/api/perfil/me/comunidades`,
        { comunidadId },
      );
      await fetchPerfil();
      return data;
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchPerfil]);

  const eliminarComunidad = useCallback(async (comunidadId: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`${BASE_URL}/api/perfil/me/comunidades/${comunidadId}`);
      await fetchPerfil();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchPerfil]);

  const setPrincipal = useCallback(async (comunidadId: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.patch(
        `${BASE_URL}/api/perfil/me/comunidades/${comunidadId}/principal`,
      );
      await fetchPerfil();
      return data;
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchPerfil]);

  const buscarComunidades = useCallback(async (cp: string) => {
    try {
      const { data } = await api.get('/codigos-postales', { params: { codigo: cp } });
      return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message);
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