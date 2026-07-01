/**
 * Handle project room join/leave for real-time graph updates.
 */
export function setupProjectSocket(socket) {
  socket.on('join:project', ({ projectId }) => {
    if (projectId) {
      socket.join(`project:${projectId}`);
    }
  });

  socket.on('leave:project', ({ projectId }) => {
    if (projectId) {
      socket.leave(`project:${projectId}`);
    }
  });
}
