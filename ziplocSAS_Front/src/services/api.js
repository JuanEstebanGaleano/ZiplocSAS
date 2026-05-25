import apiClient from '../api/axios.js';
import { parseApiError } from '../api/errorParser';

function unwrap(payload) {
  if (!payload) return null;
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

async function safeRequest(method, path, data, config = {}) {
  try {
    const res = await apiClient.request({ method, url: path, data, ...config });
    return unwrap(res);
  } catch (err) {
    const parsed = parseApiError(err);
    const e = new Error(parsed.message);
    e.status = parsed.status;
    e.data = parsed.data;
    e.isConnectionError = parsed.isConnectionError;
    throw e;
  }
}

export function crearUsuario(payload) {
  return safeRequest('post', '/usuarios', payload);
}

export function obtenerUsuarios(config) {
  return safeRequest('get', '/usuarios', undefined, config);
}

export function obtenerUsuariosTopPuntos(config) {
  return safeRequest('get', '/usuarios/top-puntos', undefined, config);
}

export function obtenerUsuariosPorRangoPuntos(min, max, config = {}) {
  return safeRequest('get', '/usuarios/puntos/rango', undefined, {
    ...config,
    params: { min, max, ...(config.params || {}) },
  });
}

export function obtenerUsuarioPorId(id, config) {
  return safeRequest('get', `/usuarios/${id}`, undefined, config);
}

export function actualizarUsuario(id, payload) {
  return safeRequest('put', `/usuarios/${id}`, payload);
}

export function eliminarUsuario(id) {
  return safeRequest('delete', `/usuarios/${id}`);
}

// ← NUEVO: toggle activo/inactivo
export function toggleActivoUsuario(id, activo) {
  return safeRequest('patch', `/usuarios/${id}/activo`, undefined, { params: { activo } });
}

export function crearBilletera(payload) {
  return safeRequest('post', '/billeteras', payload);
}

export function obtenerBilleteraPorId(id, config) {
  return safeRequest('get', `/billeteras/${id}`, undefined, config);
}

export function obtenerBilleterasPorUsuario(usuarioId, config) {
  return safeRequest('get', `/billeteras/usuario/${usuarioId}`, undefined, config);
}

export function actualizarBilletera(id, payload) {
  return safeRequest('put', `/billeteras/${id}`, payload);
}

export function obtenerSaldoBilletera(id, config) {
  return safeRequest('get', `/billeteras/${id}/saldo`, undefined, config);
}

export function crearTransaccion(payload) {
  return safeRequest('post', '/transacciones', payload);
}

export function obtenerTransaccionPorId(id, config) {
  return safeRequest('get', `/transacciones/${id}`, undefined, config);
}

export function obtenerTransaccionesPorBilletera(billeteraId, config) {
  return safeRequest('get', `/transacciones/billetera/${billeteraId}`, undefined, config);
}

export function revertirTransaccion(id) {
  return safeRequest('post', `/transacciones/${id}/revertir`);
}

export function obtenerPuntosRecompensas(usuarioId, config) {
  return safeRequest('get', `/recompensas/${usuarioId}/puntos`, undefined, config);
}

export function obtenerNivelRecompensas(usuarioId, config) {
  return safeRequest('get', `/recompensas/${usuarioId}/nivel`, undefined, config);
}

export function canjearBeneficio(usuarioId, beneficioId) {
  return safeRequest('post', `/recompensas/${usuarioId}/canjear/${beneficioId}`);
}

export function obtenerBeneficios(config) {
  return safeRequest('get', '/recompensas/beneficios', undefined, config);
}

export function obtenerReporteAnalitica(usuarioId, config) {
  return safeRequest('get', `/analitica/reporte/${usuarioId}`, undefined, config);
}

export function obtenerFrecuenciaTiposAnalitica(config) {
  return safeRequest('get', '/analitica/frecuencia-tipos', undefined, config);
}

export function obtenerCategoriasActivasAnalitica(config) {
  return safeRequest('get', '/analitica/categorias-activas', undefined, config);
}

export function obtenerMontoTotalAnalitica(config) {
  return safeRequest('get', '/analitica/monto-total', undefined, config);
}

export function obtenerGrafoAnalitica(usuarioId, config) {
  return safeRequest('get', `/analitica/grafo/${usuarioId}`, undefined, config);
}

export function obtenerTransaccionesMayorValorAnalitica(config) {
  return safeRequest('get', '/analitica/transacciones-mayor-valor', undefined, config);
}

export function obtenerRendimientoAnalitica(usuarioId, config) {
  return safeRequest('get', `/analitica/rendimiento/${usuarioId}`, undefined, config);
}

export function obtenerTopBilleteras(config) {
  return safeRequest('get', '/analitica/top-billeteras', undefined, config);
}

export function obtenerUsuariosActivos(config) {
  return safeRequest('get', '/analitica/usuarios-activos', undefined, config);
}

export function obtenerAuditoriaUsuario(usuarioId, config) {
  return safeRequest('get', `/analitica/auditoria/${usuarioId}`, undefined, config);
}

export function obtenerBilleteras(config) {
  return safeRequest('get', '/billeteras', undefined, config);
}

export function eliminarBilletera(id) {
  return safeRequest('delete', `/billeteras/${id}`);
}

export function recargarTransaccion(payload) {
  return safeRequest('post', '/transacciones/recargar', payload);
}

export function retirarTransaccion(payload) {
  return safeRequest('post', '/transacciones/retirar', payload);
}

export function transferirTransaccion(payload) {
  return safeRequest('post', '/transacciones/transferir', payload);
}

export function revertirUltimaTransaccion(payload) {
  return safeRequest('post', '/transacciones/revertir-ultima', payload);
}
// Agrega esto al final de services/api.js
export function obtenerOperacionesProgramadas(usuarioId, config) {
  return safeRequest('get', `/programadas?usuarioId=${usuarioId}`, undefined, config);
}

export function obtenerOperacionesProcesadas(usuarioId, config) {
  return safeRequest('get', `/programadas/procesadas?usuarioId=${usuarioId}`, undefined, config);
}

export function crearOperacionProgramadaApi(data) {
  return safeRequest('post', '/programadas', data);
}

export function procesarOperacionApi(hasta) {
  return safeRequest('post', `/programadas/procesar?hasta=${encodeURIComponent(hasta)}`);
}