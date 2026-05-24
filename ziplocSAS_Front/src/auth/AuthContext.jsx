import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthSession, decodeJwtPayload, getAccessToken, getRefreshToken, getStoredAuthSession, getStoredUser, isJwtExpired, normalizeAuthSessionPayload, setAuthSession } from './authStorage';
import { login as authLogin, register as authRegister } from './authService';
import { AUTH_EVENTS } from './authConfig';

const AuthContext = createContext(null);

function buildState({ accessToken, refreshToken, user, status, error = null, sessionExpired = false }) {
  return {
    accessToken,
    refreshToken,
    user,
    status,
    error,
    sessionExpired,
  };
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState(() => buildState({
    ...getStoredAuthSession(),
    user: getStoredUser(),
    status: 'loading',
  }));

  const applySession = useCallback((session, status = 'authenticated') => {
    const next = normalizeAuthSessionPayload(session);
    setAuthSession({ accessToken: next.accessToken, refreshToken: next.refreshToken, user: next.user });
    setState(buildState({
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
      user: next.user,
      status,
      error: null,
      sessionExpired: false,
    }));
  }, []);

  const performLogout = useCallback(async (reason = 'logout') => {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();
    const isDemo = decodeJwtPayload(accessToken)?.demo || false;
    
    try {
      // if (refreshToken && !isDemo) {
      //   await authLogout(refreshToken);
      // }
    } finally {
      clearAuthSession();
      queryClient.clear();
      setState(buildState({
        accessToken: null,
        refreshToken: null,
        user: null,
        status: 'unauthenticated',
        error: reason === 'session-expired' ? 'La sesión expiró. Vuelve a iniciar sesión.' : null,
        sessionExpired: reason === 'session-expired',
      }));
    }
  }, [queryClient]);

  const bootstrap = useCallback(async () => {
    try {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      const user = getStoredUser();

      if (accessToken && !isJwtExpired(accessToken)) {
        setState(buildState({
          accessToken,
          refreshToken,
          user,
          status: 'authenticated',
          error: null,
          sessionExpired: false,
        }));
        return;
      }

      if (refreshToken) {
        // Dummy fallback since we removed refreshSession
        setState(buildState({
          accessToken: null,
          refreshToken: null,
          user: null,
          status: 'unauthenticated',
        }));
        return;
      }

      setState(buildState({
        accessToken: null,
        refreshToken: null,
        user: null,
        status: 'unauthenticated',
      }));
    } catch (error) {
      clearAuthSession();
      setState(buildState({
        accessToken: null,
        refreshToken: null,
        user: null,
        status: 'unauthenticated',
        error: error?.message || 'No fue posible restaurar la sesión.',
        sessionExpired: true,
      }));
    }
  }, [applySession]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (state.status !== 'authenticated' || !state.accessToken) return undefined;
    const payload = decodeJwtPayload(state.accessToken);
    if (!payload?.exp) return undefined;

    const expiresInMs = Math.max((payload.exp * 1000) - Date.now() - 60000, 0);
    const timerId = window.setTimeout(async () => {
      try {
        if (state.refreshToken) {
           await performLogout('session-expired');
        } else {
          await performLogout('session-expired');
        }
      } catch {
        await performLogout('session-expired');
      }
    }, expiresInMs);

    return () => window.clearTimeout(timerId);
  }, [applySession, performLogout, state.accessToken, state.refreshToken, state.status]);

  useEffect(() => {
    function handleSessionChange(event) {
      const detail = event.detail || {};
      setState(buildState({
        accessToken: detail.accessToken || getAccessToken(),
        refreshToken: detail.refreshToken || getRefreshToken(),
        user: detail.user || getStoredUser(),
        status: 'authenticated',
        error: null,
        sessionExpired: false,
      }));
    }

    function handleLogout() {
      setState(buildState({
        accessToken: null,
        refreshToken: null,
        user: null,
        status: 'unauthenticated',
        error: null,
        sessionExpired: false,
      }));
    }

    function handleStorage(event) {
      if (!event.key) return;
      if (event.key.includes('ZiplocSAS_auth_')) {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        const user = getStoredUser();
        setState((current) => ({
          ...current,
          accessToken,
          refreshToken,
          user,
          status: accessToken || refreshToken ? 'authenticated' : 'unauthenticated',
        }));
      }
    }

    window.addEventListener(AUTH_EVENTS.sessionChanged, handleSessionChange);
    window.addEventListener(AUTH_EVENTS.loggedOut, handleLogout);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(AUTH_EVENTS.sessionChanged, handleSessionChange);
      window.removeEventListener(AUTH_EVENTS.loggedOut, handleLogout);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const session = await authLogin(credentials);
      applySession(session, 'authenticated');
      return session;
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'unauthenticated',
        error: error?.message || 'No fue posible iniciar sesión.',
      }));
      throw error;
    }
  }, [applySession]);

  const register = useCallback(async (userData) => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const session = await authRegister(userData);
      applySession(session, 'authenticated');
      return session;
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'unauthenticated',
        error: error?.message || 'No fue posible crear la cuenta.',
      }));
      throw error;
    }
  }, [applySession]);

  const value = useMemo(() => ({
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    isAuthenticated: state.status === 'authenticated',
    isLoading: state.status === 'loading',
    authError: state.error,
    sessionExpired: state.sessionExpired,
    login,
    register,
    logout: performLogout,
  }), [login, register, performLogout, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
