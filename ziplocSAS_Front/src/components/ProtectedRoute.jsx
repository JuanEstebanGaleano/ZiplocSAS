import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../auth/AuthContext';
import Login from '../pages/Login';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, sessionExpired, authError } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-fondo"><LoadingSpinner /></div>;
  }

  if (!isAuthenticated) {
    return <Login sessionExpired={sessionExpired} initialError={authError} />;
  }

  return children;
}
