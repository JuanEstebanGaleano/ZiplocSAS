export type Nivel = 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';

export type UsuarioEstado = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  puntos: number;
  nivel: Nivel;
  creadoAt: string;
  actualizadoAt?: string;
  activo: boolean;
  estado?: UsuarioEstado;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  telefono: string;
}

export interface UsuarioResponse {
  usuario?: Usuario;
  usuarios?: Usuario[];
  total?: number;
  page?: number;
  size?: number;
}

export interface UsuariosPorRangoResponse {
  usuarios?: Usuario[];
  total?: number;
  minimo?: number;
  maximo?: number;
}

export interface TopUsuariosResponse {
  usuarios?: Usuario[];
  topUsuarios?: Usuario[];
  total?: number;
}
