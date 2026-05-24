import { AUTH_EVENTS, AUTH_STORAGE_KEYS } from './authConfig';

function canUseStorage() {
  return typeof window !== 'undefined';
}

function safeParse(json) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isJwtExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= (payload.exp * 1000) - (skewSeconds * 1000);
}

export function normalizeAuthSessionPayload(payload) {
  const data = payload?.data || payload || {};
  const accessToken = data.accessToken || data.access_token || data.token || data.jwt || null;
  const refreshToken = data.refreshToken || data.refresh_token || null;
  const user = data.user || data.usuario || data.profile || (data.id ? data : null) || null;
  return { accessToken, refreshToken, user, raw: data };
}

export function getStoredAuthSession() {
  if (!canUseStorage()) {
    return { accessToken: null, refreshToken: null, user: null };
  }

  const accessToken = sessionStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
  const userRaw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
  const user = safeParse(userRaw);

  return { accessToken, refreshToken, user };
}

export function getAccessToken() {
  return canUseStorage() ? sessionStorage.getItem(AUTH_STORAGE_KEYS.accessToken) : null;
}

export function getRefreshToken() {
  return canUseStorage() ? localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken) : null;
}

export function getStoredUser() {
  if (!canUseStorage()) return null;
  const userRaw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
  return safeParse(userRaw);
}

export function setAuthSession({ accessToken, refreshToken, user }) {
  if (!canUseStorage()) return;
  if (accessToken) sessionStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  if (user) localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));

  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.sessionChanged, {
    detail: {
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      user: user || null,
    },
  }));
}

export function clearAuthSession() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.loggedOut));
}
