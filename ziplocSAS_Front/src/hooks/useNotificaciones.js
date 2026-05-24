import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

async function obtenerNotificaciones(usuarioId) {
  if (!usuarioId) return { notificaciones: [] };
  const response = await apiClient.get(`/notificaciones/${usuarioId}`);
  // ✅ FIX: normalizar la respuesta — puede llegar como array directo,
  // como { notificaciones: [...] }, o como { data: [...] } dependiendo
  // de si viene de la API real o del fallback demo corregido.
  if (Array.isArray(response)) {
    return { notificaciones: response };
  }
  if (Array.isArray(response?.notificaciones)) {
    return response;
  }
  if (Array.isArray(response?.data)) {
    return { notificaciones: response.data };
  }
  return { notificaciones: [] };
}

async function marcarLectura(usuarioId, notificacionId) {
  const response = await apiClient.put(`/notificaciones/${usuarioId}/${notificacionId}/leer`);
  return response;
}

async function despacharNotificacion(usuarioId) {
  const response = await apiClient.post(`/notificaciones/${usuarioId}/despachar`);
  return response;
}

export function useNotificaciones(usuarioId) {
  return useQuery({
    queryKey: ['notificaciones', usuarioId],
    queryFn: ({ signal }) => obtenerNotificaciones(usuarioId, { signal }),
    enabled: !!usuarioId,
  });
}

export function useMarcarLectura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, notificacionId }) => marcarLectura(usuarioId, notificacionId),
    // ✅ Optimistic update: marca como leída localmente de inmediato
    // sin esperar a que el servidor responda, para que la UI reaccione al instante
    onMutate: async ({ usuarioId, notificacionId }) => {
      await queryClient.cancelQueries({ queryKey: ['notificaciones', usuarioId] });
      const previous = queryClient.getQueryData(['notificaciones', usuarioId]);
      queryClient.setQueryData(['notificaciones', usuarioId], (old) => {
        if (!old?.notificaciones) return old;
        return {
          ...old,
          notificaciones: old.notificaciones.map((n) =>
              n.id === notificacionId ? { ...n, leida: true } : n
          ),
        };
      });
      return { previous };
    },
    // Si la API falla, revertir al estado anterior
    onError: (_err, { usuarioId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notificaciones', usuarioId], context.previous);
      }
    },
    // Siempre refrescar desde el servidor al terminar
    onSettled: (_data, _err, { usuarioId }) => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones', usuarioId] });
    },
  });
}

export function useDespacharNotificacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId) => despacharNotificacion(usuarioId),
    onSuccess: (_data, usuarioId) => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones', usuarioId] });
    },
  });
}