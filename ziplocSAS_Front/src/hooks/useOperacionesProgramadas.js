import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  obtenerOperacionesProgramadas,
  obtenerOperacionesProcesadas,
  crearOperacionProgramadaApi,
  procesarOperacionApi,
} from '../services/api';

export function useOperacionesProgramadas(usuarioId) {
  return useQuery({
    queryKey: ['programadas', usuarioId],
    queryFn: ({ signal }) => obtenerOperacionesProgramadas(usuarioId, { signal }),
    enabled: !!usuarioId,
  });
}

export function useOperacionesProcesadas(usuarioId) {
  return useQuery({
    queryKey: ['programadas-procesadas', usuarioId],
    queryFn: ({ signal }) => obtenerOperacionesProcesadas(usuarioId, { signal }),
    enabled: !!usuarioId,
  });
}

export function useCrearOperacionProgramada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => crearOperacionProgramadaApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programadas'] });
    },
  });
}

export function useProcesarOperacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hasta) => procesarOperacionApi(hasta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programadas'] });
      queryClient.invalidateQueries({ queryKey: ['programadas-procesadas'] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['billeteras'] });
    },
  });
}