export interface OperacionProgramada {
  id: number;
  fechaEjecucion: string;
  tipo: 'RECARGA' | 'RETIRO' | 'TRANSFERENCIA' | 'PAGO_PROGRAMADO';
  valor: number;
  billeteraDestinoId?: number;
  billeteraOrigenId?: number;
  prioridad: number;
  descripcion?: string;
  estado?: 'PENDIENTE' | 'EJECUTADA' | 'CANCELADA';
}

export interface OperacionProgramadaRequest {
  fechaEjecucion: string;
  tipo: 'RECARGA' | 'RETIRO' | 'TRANSFERENCIA' | 'PAGO_PROGRAMADO';
  valor: number;
  billeteraDestinoId?: number;
  billeteraOrigenId?: number;
  prioridad: number;
  descripcion?: string;
}
