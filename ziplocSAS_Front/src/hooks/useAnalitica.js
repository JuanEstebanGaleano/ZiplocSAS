import { useQuery } from '@tanstack/react-query';
import {
  obtenerReporteAnalitica,
  obtenerFrecuenciaTiposAnalitica,
  obtenerCategoriasActivasAnalitica,
  obtenerMontoTotalAnalitica,
  obtenerGrafoAnalitica,
  obtenerTransaccionesMayorValorAnalitica,
  obtenerRendimientoAnalitica,
  obtenerTopBilleteras,
  obtenerUsuariosActivos,
  obtenerAuditoriaUsuario,
} from '../services/api';

// Hook para obtener reporte analítico del usuario
export function useReporteAnalitica(usuarioId) {
  return useQuery({
    queryKey: ['analitica-reporte', usuarioId],
    queryFn: ({ signal }) => obtenerReporteAnalitica(usuarioId, { signal }),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useFrecuenciaTiposAnalitica() {
  return useQuery({
    queryKey: ['analitica-frecuencia-tipos'],
    queryFn: ({ signal }) => obtenerFrecuenciaTiposAnalitica({ signal }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategoriasActivasAnalitica() {
  return useQuery({
    queryKey: ['analitica-categorias-activas'],
    queryFn: ({ signal }) => obtenerCategoriasActivasAnalitica({ signal }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useMontoTotalAnalitica(inicio, fin) {
  return useQuery({
    queryKey: ['analitica-monto-total', inicio, fin],
    queryFn: ({ signal }) => obtenerMontoTotalAnalitica({
      signal,
      params: (inicio || fin) ? { inicio, fin } : undefined
    }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useGrafoAnalitica(usuarioId) {
  return useQuery({
    queryKey: ['analitica-grafo', usuarioId],
    queryFn: ({ signal }) => obtenerGrafoAnalitica(usuarioId, { signal }),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useTransaccionesMayorValorAnalitica(limite = 10) {
  return useQuery({
    queryKey: ['analitica-transacciones-mayor-valor', limite],
    queryFn: ({ signal }) => obtenerTransaccionesMayorValorAnalitica({ signal, params: { limite } }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useRendimientoAnalitica(usuarioId) {
  return useQuery({
    queryKey: ['analitica-rendimiento', usuarioId],
    queryFn: ({ signal }) => obtenerRendimientoAnalitica(usuarioId, { signal }),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook para obtener billeteras top
export function useTopBilleteras() {
  return useQuery({
    queryKey: ['analitica-top-billeteras'],
    queryFn: ({ signal }) => obtenerTopBilleteras({ signal }),
    staleTime: 1000 * 60 * 10,
  });
}

// Hook para obtener usuarios activos
export function useUsuariosActivos() {
  return useQuery({
    queryKey: ['analitica-usuarios-activos'],
    queryFn: ({ signal }) => obtenerUsuariosActivos({ signal }),
    staleTime: 1000 * 60 * 10,
  });
}

// Hook para obtener eventos de auditoría
export function useAuditoriaUsuario(usuarioId) {
  return useQuery({
    queryKey: ['analitica-auditoria', usuarioId],
    queryFn: ({ signal }) => obtenerAuditoriaUsuario(usuarioId, { signal }),
    enabled: !!usuarioId,
    staleTime: 1000 * 60 * 10,
  });
}
