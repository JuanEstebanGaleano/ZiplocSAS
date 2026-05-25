import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';

import './styles/global.css';

/* ================================
   QUERY CLIENT (CONFIG PRODUCCIÓN)
================================ */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error?.status;

        // ❌ No reintentar errores críticos
        if (
            error?.isConnectionError ||
            error?.isAuthError ||
            status === 401 ||
            status === 403
        ) {
          return false;
        }

        // 🔁 Reintento controlado
        return failureCount < 1;
      },

      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 🔥 cache 2 min (mejor UX)
      gcTime: 1000 * 60 * 10,   // 🧠 garbage collector cache
    },

    mutations: {
      retry: (failureCount, error) => {
        const status = error?.status;

        if (
            error?.isConnectionError ||
            error?.isAuthError ||
            status === 401 ||
            status === 403
        ) {
          return false;
        }

        return failureCount < 1;
      },
    },
  },
});

/* ================================
   ROOT RENDER
================================ */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('❌ Root element not found. Check index.html');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary>
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          </ErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
);