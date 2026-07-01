import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { setupProjectSocket } from './socket/projectSocket.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await connectRedis();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  app.set('io', io);
  io.on('connection', (socket) => setupProjectSocket(socket));

  server.listen(PORT, () => {
    console.log(`FlowForge API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
