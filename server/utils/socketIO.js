let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require("socket.io");
    io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", process.env.APP_FRONTEND_URL, process.env.ADMIN_FRONTEND_URL].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
