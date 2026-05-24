export type TransaccionTipo = 'RECARGA' | 'RETIRO' | 'TRANSFERENCIA' | 'PAGO_PROGRAMADO';
export type TransaccionEstado = 'PENDIENTE' | 'COMPLETADA' | 'REVERTIDA' | 'FALLIDA';

export interface Transaccion {
  id: number;
  tipo: TransaccionTipo;
  valor: number;
  estado: TransaccionEstado;
  fecha: string;
  billeteraOrigenId?: number;
  billeteraDestinoId?: number;
  descripcion?: string;
  referencia?: string;
}
