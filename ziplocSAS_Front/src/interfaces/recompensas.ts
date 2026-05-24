export interface RecompensasInfo {
  puntos: number;
  puntosAcumulados?: number;
  nivel: string;
}

export interface NivelInfo {
  nivel: string;
  puntosActuales: number;
  umbralSiguiente: number;
}

export interface Beneficio {
  id: string | number;
  descripcion: string;
  nivelRequerido: string;
  puntosNecesarios: number;
  tipo: string;
  activo: boolean;
}

export interface CanjeResponse {
  mensaje?: string;
  puntosRestantes?: number;
  success?: boolean;
}
