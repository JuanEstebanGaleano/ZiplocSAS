export const AUTH_ENDPOINTS = {
  login: import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/usuarios/login',
};

export const AUTH_STORAGE_KEYS = {
  accessToken: 'ZiplocSAS_auth_access_token',
  refreshToken: 'ZiplocSAS_auth_refresh_token',
  user: 'ZiplocSAS_auth_user',
};

export const AUTH_EVENTS = {
  sessionChanged: 'ZiplocSAS:auth-session-changed',
  loggedOut: 'ZiplocSAS:auth-logged-out',
};
