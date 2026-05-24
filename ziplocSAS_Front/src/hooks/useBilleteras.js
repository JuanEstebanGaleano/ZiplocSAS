import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  obtenerBilleterasPorUsuario,
  obtenerBilleteraPorId,
  crearBilletera,
  actualizarBilletera,
} from '../services/api';

// Hook para obtener billeteras de un usuario
export function useBilleteras(usuarioId) {
  return useQuery({
    queryKey: ['billeteras', usuarioId],
    queryFn: ({ signal }) => obtenerBilleterasPorUsuario(usuarioId, { signal }),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook para obtener una billetera específica
export function useBilletera(billeteraId) {
  return useQuery({
    queryKey: ['billetera', billeteraId],
    queryFn: ({ signal }) => obtenerBilleteraPorId(billeteraId, { signal }),
    enabled: !!billeteraId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para crear billetera
export function useCrearBilletera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearBilletera,
    onSuccess: (data) => {
      // Invalidate list queries after create
      if (data?.usuarioId) {
        queryClient.invalidateQueries({ queryKey: ['billeteras', data.usuarioId] });
      }
    },
  });
}

// Hook para actualizar billetera
export function useActualizarBilletera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => {
      const id = variables?.id;
      const payload = variables?.payload ?? variables?.data ?? {};
      return actualizarBilletera(id, payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billetera', variables.id] });
      if (data?.usuarioId) {
        queryClient.invalidateQueries({ queryKey: ['billeteras', data.usuarioId] });
      }
    },
  });
}
