// src/lib/socket.ts
import { Server } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const initializeSocket = (server: Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.PATH_ORIGIN_APPLICATION_SOCKET,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.log("Novo cliente conectado");

    socket.on("disconnect", () => {
      console.log("Cliente desconectado");
    });
  });
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.IO não foi inicializado");
  }
  return io;
};
