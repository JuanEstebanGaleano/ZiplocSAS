import axios from 'axios';
import { AUTH_ENDPOINTS } from '../auth/authConfig';
import { clearAuthSession, getAccessToken, getRefreshToken, normalizeAuthSessionPayload, setAuthSession, decodeJwtPayload } from '../auth/authStorage';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const DEMO_USER_ID = 1;
const DEMO_USER = {
  id: DEMO_USER_ID,
  nombre: 'Usuario Demo',
  email: 'demo@ZiplocSAS.local',
  telefono: '3000000000',
  puntos: 1200,
  nivel: 'Oro',
  creadoAt: '2026-05-15T00:00:00.000Z',
  actualizadoAt: '2026-05-15T00:00:00.000Z',
  activo: true,
  estado: 'ACTIVO',
};

const DEMO_BILLETERAS = [
  { id: 1, usuarioId: DEMO_USER_ID, nombre: 'Billetera principal', tipo: 'Ahorro', saldo: 245000, estado: 'activo' },
  { id: 2, usuarioId: DEMO_USER_ID, nombre: 'Gastos diarios', tipo: 'Gastos diarios', saldo: 78000, estado: 'activo' },
];

const DEMO_TRANSACCIONES = {
  1: [
    { id: 101, tipo: 'INGRESO', monto: 120000, descripcion: 'Abono de nómina', fecha: '2026-05-14T16:20:00.000Z' },
    { id: 102, tipo: 'EGRESO', monto: 35000, descripcion: 'Pago de servicios', fecha: '2026-05-14T18:40:00.000Z' },
    { id: 103, tipo: 'TRANSFERENCIA', monto: 18000, descripcion: 'Transferencia a contacto', fecha: '2026-05-15T08:10:00.000Z' },
  ],
  2: [
    { id: 201, tipo: 'EGRESO', monto: 15000, descripcion: 'Mercado', fecha: '2026-05-15T09:30:00.000Z' },
    { id: 202, tipo: 'EGRESO', monto: 8200, descripcion: 'Transporte', fecha: '2026-05-15T11:05:00.000Z' },
  ],
};

// Demo notificaciones
const DEMO_NOTIFICACIONES = [
  { id: 1, usuarioId: DEMO_USER_ID, titulo: 'Bienvenido a ZiplocSAS', mensaje: 'Tu cuenta ha sido activada exitosamente.', tipo: 'bienvenida', leida: false, fecha: '2026-05-15T08:00:00.000Z' },
  { id: 2, usuarioId: DEMO_USER_ID, titulo: 'Pago recibido', mensaje: 'Se acreditaron $120.000 en tu billetera principal.', tipo: 'pago', leida: false, fecha: '2026-05-14T16:21:00.000Z' },
  { id: 3, usuarioId: DEMO_USER_ID, titulo: 'Nivel Oro alcanzado', mensaje: 'Felicitaciones, alcanzaste el nivel Oro.', tipo: 'recompensa', leida: true, fecha: '2026-05-13T10:00:00.000Z' },
];

function isDemoSession() {
  const token = getAccessToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return Boolean(payload?.demo);
}

function buildDemoFallback(path) {
  if (/^\/usuarios\/\d+$/.test(path)) return DEMO_USER;
  if (/^\/usuarios$/.test(path)) return [DEMO_USER];
  if (/^\/usuarios\/top-puntos$/.test(path)) return [DEMO_USER];
  if (/^\/usuarios\/puntos\/rango$/.test(path)) return [DEMO_USER];
  if (/^\/billeteras\/usuario\/\d+$/.test(path)) return { billeteras: DEMO_BILLETERAS, total: DEMO_BILLETERAS.length };
  if (/^\/billeteras\/\d+$/.test(path)) {
    const id = Number(path.split('/')[2]);
    return DEMO_BILLETERAS.find((w) => w.id === id) || DEMO_BILLETERAS[0];
  }
  if (/^\/billeteras\/\d+\/saldo$/.test(path)) {
    const id = Number(path.split('/')[2]);
    const wallet = DEMO_BILLETERAS.find((item) => item.id === id) || DEMO_BILLETERAS[0];
    return { billeteraId: wallet.id, saldo: wallet.saldo };
  }
  if (/^\/transacciones\/billetera\/\d+$/.test(path)) {
    const id = Number(path.split('/')[3]);
    return { transacciones: DEMO_TRANSACCIONES[id] || [] };
  }
  if (/^\/transacciones\/\d+$/.test(path)) {
    const allTransactions = Object.values(DEMO_TRANSACCIONES).flat();
    const id = Number(path.split('/')[2]);
    return allTransactions.find((t) => t.id === id) || null;
  }
  if (/^\/recompensas\/\d+\/puntos$/.test(path)) {
    return { usuarioId: DEMO_USER_ID, puntos: DEMO_USER.puntos, puntosAcumulados: DEMO_USER.puntos, nivel: DEMO_USER.nivel };
  }
  if (/^\/recompensas\/\d+\/nivel$/.test(path)) {
    // ✅ FIX: campos completos y consistentes para que Dashboard los lea correctamente
    return { usuarioId: DEMO_USER_ID, nivel: DEMO_USER.nivel, puntosActuales: DEMO_USER.puntos, umbralSiguiente: 1500 };
  }
  if (/^\/recompensas\/beneficios$/.test(path)) {
    return {
      beneficios: [
        { id: '1', descripcion: 'Reduce el costo de operaciones frecuentes.', nivelRequerido: 'Bronce', puntosNecesarios: 120, tipo: 'descuento_transferencias', activo: true },
        { id: '2', descripcion: 'Recibe bonificación directa sobre tu billetera.', nivelRequerido: 'Plata', puntosNecesarios: 180, tipo: 'bonificacion_saldo', activo: true },
      ],
    };
  }
  // ✅ FIX: fallback para notificaciones
  if (/^\/notificaciones\/\d+$/.test(path)) {
    return { notificaciones: DEMO_NOTIFICACIONES };
  }
  if (/^\/notificaciones\/\d+\/\d+\/leer$/.test(path)) {
    return { ok: true };
  }
  if (/^\/notificaciones\/\d+\/despachar$/.test(path)) {
    return { ok: true };
  }
  if (/^\/analitica\//.test(path)) {
    return { data: [], total: 0 };
  }
  return null;
}

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (config.skipAuthHeader) return config;
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
    (response) => {
      // Desenvuelve ApiResponse<T> si el backend usa ese wrapper
      const payload = response.data;
      if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
        if (!payload.success) {
          const err = new Error(payload.message || 'Error from API');
          err.status = response.status;
          err.data = payload;
          throw err;
        }
        return payload.data;
      }
      return response.data;
    },
    async (error) => {
      // ✅ FIX PRINCIPAL: devolver fallback directamente, sin envolver en { data: fallback }
      // Antes: return { data: fallback } → los hooks recibían un objeto con capa extra
      // Ahora: return fallback → igual que el interceptor de éxito
      if (error.response?.status === 404 && isDemoSession()) {
        const fallback = buildDemoFallback(error.config?.url || '');
        if (fallback !== null) {
          return fallback;
        }
      }

      const originalRequest = error.config || {};

      if (error.response?.status === 401 && !originalRequest.skipAuthRefresh) {
        clearAuthSession();
        const authError = new Error('Sesión inválida o expirada');
        authError.status = 401;
        authError.isAuthError = true;
        throw authError;
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        const err = new Error('Backend server is unavailable. Please check if the server is running at ' + API_BASE);
        err.status = 0;
        err.isConnectionError = true;
        throw err;
      }

      const serverMessage = error.response?.data?.message
          || error.response?.data?.error
          || error.response?.data?.detail
          || error.message
          || 'Network error';
      const err = new Error(serverMessage);
      if (error.response) {
        err.status = error.response.status;
        err.data = error.response.data;
      }
      throw err;
    }
);

export { API_BASE };
export default apiClient;