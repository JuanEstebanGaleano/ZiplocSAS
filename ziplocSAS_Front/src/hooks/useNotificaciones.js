import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

async function obtenerNotificaciones(usuarioId) {
  if (!usuarioId) return { notificaciones: [] };
  const response = await apiClient.get(`/notificaciones/${usuarioId}`);
  return response;
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
    onSuccess: (data, { usuarioId }) => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones', usuarioId] });
    },
  });
}

export function useDespacharNotificacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId) => despacharNotificacion(usuarioId),
    onSuccess: (data, usuarioId) => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones', usuarioId] });
    },
  });
}
