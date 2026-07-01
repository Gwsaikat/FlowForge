import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth.js';
import { useAuthStore } from './store/useAuthStore.js';
import { useDemoStore } from './store/useDemoStore.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import { DEMO_PROJECT_ID } from './demo/demoData.js';

export default function App() {
  useAuth();
  const { isAuthenticated, isLoading } = useAuthStore();
  const isDemoMode = useDemoStore((s) => s.isDemoMode);

  return (
    <BrowserRouter>
      {isDemoMode && <DemoBanner />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'rgba(36,41,56,0.95)', color: '#EAEEF5', backdropFilter: 'blur(12px)', border: '1px solid #2E3446' },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={
            isLoading && !isDemoMode ? (
              <div className="loading-full"><div className="spinner" /></div>
            ) : isDemoMode ? (
              <Navigate to={`/projects/${DEMO_PROJECT_ID}`} replace />
            ) : isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
