import { useEffect } from 'react';
import { getCurrentUser, refreshAccessToken } from '../services/authService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useDemoStore } from '../store/useDemoStore.js';
import { activateRecruiterDemo, isInDemoMode } from '../demo/demoApi.js';

/**
 * Restore auth session — skipped entirely in recruiter demo mode.
 */
export function useAuth() {
  const { setUser, setAccessToken, setLoading, logout } = useAuthStore();
  const isDemoMode = useDemoStore((s) => s.isDemoMode);

  useEffect(() => {
    if (isDemoMode || isInDemoMode()) {
      activateRecruiterDemo();
      return;
    }

    async function restoreSession() {
      setLoading(true);
      try {
        const { accessToken } = await refreshAccessToken();
        setAccessToken(accessToken);
        const { user } = await getCurrentUser();
        setUser(user);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, [isDemoMode, setUser, setAccessToken, setLoading, logout]);
}
