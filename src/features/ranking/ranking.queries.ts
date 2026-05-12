import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/axios';
import { UsuarioRanking } from './ranking.types';

async function fetchRanking(): Promise<UsuarioRanking[]> {
    const res = await api.get('/ranking');
    return res.data;
}

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: fetchRanking,
  });
}