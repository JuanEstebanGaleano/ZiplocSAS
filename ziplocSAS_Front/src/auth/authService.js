import apiClient from '../api/axios';
import { AUTH_ENDPOINTS } from './authConfig';
import { normalizeAuthSessionPayload } from './authStorage';

function buildLoginPayload(credentials) {
  const identifier = String(
    credentials?.email ||
    credentials?.username ||
    credentials?.identifier ||
    credentials?.correo ||
    ''
  ).trim();

  return {
    email: identifier,
    username: identifier,
    identifier,
    correo: identifier,
    password: credentials?.password || '',
  };
}

export async function login(credentials) {
  const response = await apiClient.post(AUTH_ENDPOINTS.login, buildLoginPayload(credentials), {
    skipAuthHeader: true,
    skipAuthRefresh: true,
  });
  return normalizeAuthSessionPayload(response);
}

export async function register(userData) {
  const payload = {
    nombre: userData.nombre,
    email: userData.email,
    contrasena: userData.password,
    telefono: userData.telefono || '0000000000'
  };
  
  const response = await apiClient.post('/usuarios', payload, {
    skipAuthHeader: true,
  });
  
  // Try to log in immediately after successful registration
  return login({ email: userData.email, password: userData.password });
}

