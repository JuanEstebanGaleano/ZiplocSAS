import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  obtenerTransaccionesPorBilletera,
  obtenerTransaccionPorId,
  crearTransaccion,
  recargarTransaccion,
  retirarTransaccion,
  transferirTransaccion,
  revertirTransaccion,
} from '../services/api';

// Hook para obtener transacciones de una billetera
export function useTransacciones(billeteraId) {
  return useQuery({
    queryKey: ['transacciones', billeteraId],
    queryFn: ({ signal }) => obtenerTransaccionesPorBilletera(billeteraId, { signal }),
    enabled: !!billeteraId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook para obtener una transacción específica
export function useTransaccion(transaccionId) {
  return useQuery({
    queryKey: ['transaccion', transaccionId],
    queryFn: ({ signal }) => obtenerTransaccionPorId(transaccionId, { signal }),
    enabled: !!transaccionId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para crear transacción
export function useCrearTransaccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const { tipo, ...rest } = payload;
      if (tipo === 'RECARGA') return recargarTransaccion(rest);
      if (tipo === 'RETIRO') return retirarTransaccion(rest);
      if (tipo === 'TRANSFERENCIA') return transferirTransaccion(rest);
      return crearTransaccion(payload);
    },
    onSuccess: (data) => {
      // Invalidate queries after successful transaction
      if (data?.billeteraOrigenId) {
        queryClient.invalidateQueries({ queryKey: ['transacciones', data.billeteraOrigenId] });
      }
      if (data?.billeteraDestinoId) {
        queryClient.invalidateQueries({ queryKey: ['transacciones', data.billeteraDestinoId] });
      }
      // Also invalidate billeteras to refresh balance
      queryClient.invalidateQueries({ queryKey: ['billeteras'] });
    },
  });
}

// Hook para revertir transacción
export function useRevertirTransaccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertirTransaccion,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transaccion', variables] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['billeteras'] });
    },
  });
}
