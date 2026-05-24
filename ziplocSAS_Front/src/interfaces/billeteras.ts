export type BilleteraTipo =
  | 'AHORRO'
  | 'AHORROS'
  | 'GASTOS_DIARIOS'
  | 'COMPRAS'
  | 'TRANSPORTE'
  | 'CORRIENTE'
  | 'INVERSION'
  | 'CREDITO'
  | 'Ahorro'
  | 'Gastos diarios'
  | 'Compras'
  | 'Transporte'
  | 'Inversion';

export type BilleteraEstado = 'ACTIVA' | 'SUSPENDIDA' | 'CONGELADA' | 'CERRADA' | 'activo' | 'inactivo';

export interface Billetera {
  id: number;
  nombre: string;
  tipo: BilleteraTipo;
  saldo: number;
  estado: BilleteraEstado;
  usuarioId: number;
  creadoAt: string;
}

export interface BilleteraRequest {
  nombre: string;
  tipo: BilleteraTipo;
  saldo?: number;
  estado?: BilleteraEstado;
  usuarioId: number;
}
