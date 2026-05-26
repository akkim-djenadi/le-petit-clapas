const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch { /* socket accepted unauthenticated */ }
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`);
    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io non initialisé');
  return io;
};

module.exports = { initSocket, getIO };
