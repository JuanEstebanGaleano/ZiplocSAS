import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  obtenerUsuariosTopPuntos,
  obtenerUsuariosPorRangoPuntos,
} from '../services/api';

function normalizeUsuarios(payload) {
  return payload?.usuarios || payload?.topUsuarios || payload?.usuario ? (Array.isArray(payload?.usuarios) ? payload.usuarios : payload?.topUsuarios || [payload.usuario].filter(Boolean)) : payload || [];
}

export default function useUsuarios(filters = {}) {
  const query = useQuery({
    queryKey: ['usuarios', filters],
    queryFn: ({ signal }) => obtenerUsuarios({ signal }),
    staleTime: 1000 * 60 * 5,
  });

  return {
    usuarios: normalizeUsuarios(query.data),
    loading: query.isLoading,
    error: query.error,
    data: query.data,
    refetch: query.refetch,
  };
}

export function useUsuario(usuarioId) {
  return useQuery({
    queryKey: ['usuario', usuarioId],
    queryFn: ({ signal }) => obtenerUsuarioPorId(usuarioId, { signal }),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearUsuario,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['usuario', data.id] });
      }
    },
  });
}

export function useActualizarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => actualizarUsuario(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', variables.id] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['usuario', data.id] });
      }
    },
  });
}

export function useEliminarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eliminarUsuario,
    onMutate: async (usuarioId) => {
      await queryClient.cancelQueries({ queryKey: ['usuarios'] });
      const previous = queryClient.getQueryData(['usuarios']);
      queryClient.setQueryData(['usuarios'], (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.filter((item) => item.id !== usuarioId);
        if (old?.usuarios) {
          return { ...old, usuarios: old.usuarios.filter((item) => item.id !== usuarioId) };
        }
        return old;
      });
      return { previous };
    },
    onError: (error, usuarioId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['usuarios'], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useTopUsuariosPuntos() {
  return useQuery({
    queryKey: ['usuarios-top-puntos'],
    queryFn: ({ signal }) => obtenerUsuariosTopPuntos({ signal }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUsuariosPorRangoPuntos(minPuntos, maxPuntos) {
  return useQuery({
    queryKey: ['usuarios-rango-puntos', minPuntos, maxPuntos],
    queryFn: ({ signal }) => obtenerUsuariosPorRangoPuntos(minPuntos, maxPuntos, { signal }),
    enabled: Number.isFinite(minPuntos) && Number.isFinite(maxPuntos),
    staleTime: 1000 * 60 * 5,
  });
}
