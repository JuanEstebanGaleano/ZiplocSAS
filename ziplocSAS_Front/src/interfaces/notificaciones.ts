export interface Notificacion {
  id: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  tipo?: string;
}

export interface Alerta {
  id: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
}
