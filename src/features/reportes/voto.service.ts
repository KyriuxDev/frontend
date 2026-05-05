import { api } from '@/src/lib/axios';

export async function votar(reporteId: number): Promise<void> {
  await api.post(`/reportes/${reporteId}/votos`);
}

export async function quitarVoto(reporteId: number): Promise<void> {
  await api.delete(`/reportes/${reporteId}/votos`);
}

export interface VotoResumen {
  total:    number;
  yaVote:   boolean;
  usuarios: { id: number; nombre: string | null; email: string }[];
}

export async function getVotos(reporteId: number): Promise<VotoResumen> {
  const { data } = await api.get<VotoResumen>(`/reportes/${reporteId}/votos`);
  return data;
}