import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useDemoStore } from '../store/useDemoStore.js';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const isDemoMode = useDemoStore((s) => s.isDemoMode);

  if (isDemoMode) return children;

  if (isLoading) {
    return (
      <div className="loading-center loading-full">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
