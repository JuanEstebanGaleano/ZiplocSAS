import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

async function crearOperacionProgramada(data) {
  const response = await apiClient.post('/programadas', data);
  return response;
}

async function procesarOperacion(hasta) {
  const response = await apiClient.post(`/programadas/procesar?hasta=${encodeURIComponent(hasta)}`);
  return response;
}

export function useOperacionesProgramadas(usuarioId) {
  return useQuery({
    queryKey: ['programadas', usuarioId],
    queryFn: ({ signal }) => apiClient.get(`/programadas?usuarioId=${usuarioId}`, { signal }),
    enabled: !!usuarioId,
  });
}

export function useOperacionesProcesadas(usuarioId) {
  return useQuery({
    queryKey: ['programadas-procesadas', usuarioId],
    queryFn: ({ signal }) => apiClient.get(`/programadas/procesadas?usuarioId=${usuarioId}`, { signal }),
    enabled: !!usuarioId,
  });
}

export function useCrearOperacionProgramada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => crearOperacionProgramada(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programadas'] });
    },
  });
}

export function useProcesarOperacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hasta) => procesarOperacion(hasta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programadas'] });
      queryClient.invalidateQueries({ queryKey: ['programadas-procesadas'] });
    },
  });
}
