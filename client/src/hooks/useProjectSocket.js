import { useEffect } from 'react';
import toast from 'react-hot-toast';
import socket from '../socket/socket.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useGraphStore } from '../store/useGraphStore.js';

/**
 * Connect to project room and listen for real-time graph updates.
 */
import { isInDemoMode } from '../demo/demoApi.js';

export function useProjectSocket(projectId) {
  const user = useAuthStore((s) => s.user);
  const loadProjectData = useGraphStore((s) => s.loadProjectData);

  useEffect(() => {
    if (!projectId || !user || isInDemoMode()) return;

    socket.connect();
    socket.emit('join:project', { projectId, userId: user.id || user._id });

    const onGraphUpdated = async () => {
      try {
        await loadProjectData(projectId);
      } catch {
        /* ignore */
      }
    };

    const onTaskBlocked = ({ cascadeResult }) => {
      if (cascadeResult?.deadlineShift > 0) {
        toast.error(`Project delayed by ${cascadeResult.deadlineShift} days!`, {
          duration: 5000,
        });
      }
    };

    socket.on('graph:updated', onGraphUpdated);
    socket.on('task:blocked', onTaskBlocked);

    return () => {
      socket.emit('leave:project', { projectId });
      socket.off('graph:updated', onGraphUpdated);
      socket.off('task:blocked', onTaskBlocked);
      socket.disconnect();
    };
  }, [projectId, user, loadProjectData]);
}
