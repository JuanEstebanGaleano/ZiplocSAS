export interface AnaliticsReport {
  totalTransacciones: number;
  montoTotal: number;
  billeterasMasActivas?: Array<{
    id: number;
    nombre: string;
    saldo?: number;
  }>;
  frecuenciaPorTipo?: Array<{
    tipo: string;
    cantidad: number;
  }>;
  montosPorPeriodo?: Array<{
    periodo: string;
    monto: number;
  }>;
  transaccionesPorTipo?: Array<{
    tipo: string;
    cantidad: number;
  }>;
  montoPorPeriodo?: any;
  serieMontos?: any;
}

export interface FrecuenciaTipoItem {
  tipo: string;
  cantidad: number;
  monto?: number;
}

export interface CategoriaActivaItem {
  categoria: string;
  cantidad: number;
  monto?: number;
}

export interface MontoTotalResponse {
  montoTotal: number;
  moneda?: string;
  periodo?: string;
  totalTransacciones?: number;
}

export interface GrafoNodo {
  id: string | number;
  label: string;
  tipo?: string;
  nivel?: string;
  peso?: number;
}

export interface GrafoLink {
  source: string | number;
  target: string | number;
  value?: number;
  label?: string;
}

export interface GrafoUsuarioResponse {
  usuarioId: number;
  nodos?: GrafoNodo[];
  enlaces?: GrafoLink[];
  links?: GrafoLink[];
}

export interface TransaccionMayorValor {
  id: number;
  tipo: string;
  valor: number;
  fecha?: string;
  estado?: string;
  billeteraOrigenId?: number;
  billeteraDestinoId?: number;
}

export interface RendimientoUsuarioResponse {
  usuarioId: number;
  totalTransacciones?: number;
  montoTotal?: number;
  promedioTransaccion?: number;
  crecimiento?: number;
  nivel?: string;
  eficiencia?: number;
}

export interface TopBilletera {
  id: number;
  nombre: string;
  saldo: number;
  usuarioId: number;
  tipo?: string;
}

export interface UsuarioActivo {
  id: number;
  nombre: string;
  email: string;
  puntos: number;
  nivel: string;
  activo: boolean;
}

export interface EventoAuditoria {
  id: number;
  usuarioId: number;
  descripcion: string;
  riesgo: string;
  fecha: string;
  accion?: string;
}
