// import { Server } from "http";
// import jwt from "jsonwebtoken";
// import { Socket, Server as SocketIOServer } from "socket.io";
// import { prismaCliente } from "../database/prismaCliente";

// let io: SocketIOServer | null = null;

// export const initializeSocket = (server: Server) => {
//   io = new SocketIOServer(server, {
//     cors: {
//       origin: process.env.PATH_ORIGIN_APPLICATION_SOCKET,
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//     transports: ["websocket", "polling"],
//   });

//   io.on("connection", async (socket: Socket) => {
//     // 🔥 1. PEGAR TOKEN
//     // const token = socket.handshake.auth?.userId;
//     // const token = socket.handshake.auth?.token;
//     const token = socket.handshake.auth?.token || socket.handshake.auth?.userId;

//     console.log("==== token recebido", token);

//     if (!token) {
//       console.log("❌ Socket sem token");
//       socket.disconnect();
//       return;
//     }

//     // 🔥 2. VALIDAR TOKEN
//     let decoded: any;
//     console.log("chave secreta", process.env.JWT_SECRET);

//     try {
//       if (process.env.JWT_SECRET) {
//         decoded = jwt.verify(token, process.env.JWT_SECRET);
//       }
//     } catch (error) {
//       console.log("❌ Token inválido");
//       socket.disconnect();
//       return;
//     }

//     // 🔥 3. EXTRAIR USER ID DO TOKEN
//     const userId = decoded.sub; // 👈 aqui está o ID

//     if (!userId) {
//       console.log("❌ Token sem userId");
//       socket.disconnect();
//       return;
//     }

//     try {
//       // 🔥 4. BUSCAR USUÁRIO NO BANCO
//       const user = await prismaCliente.user.findUnique({
//         where: { id: userId },
//         select: { id: true, userHashPublic: true },
//       });

//       if (!user) {
//         console.log("❌ Usuário não encontrado no banco", userId);
//         socket.disconnect();
//         return;
//       }

//       const userHashPublic = user.userHashPublic;

//       console.log("==== user autenticado", userId, userHashPublic);

//       // 🔥 5. MARCAR ONLINE
//       await prismaCliente.loggedUsers.upsert({
//         where: { userId },
//         update: {
//           isOnline: true,
//           lastSeen: new Date(),
//         },
//         create: {
//           userId,
//           isOnline: true,
//           lastSeen: new Date(),
//         },
//       });

//       // 🔥 6. EMITIR ONLINE
//       io?.emit("user-online", { userId, userHashPublic });

//       console.log(`🟢 Usuário ${userId} (${userHashPublic}) ONLINE`);

//       // 🔥 7. SALAS SEGURAS
//       socket.join(userId); // interno
//       socket.join(userHashPublic); // público

//       socket.on("join", (room: string) => {
//         socket.join(room);
//       });

//       socket.on("join-send-message", (matchId: string) => {
//         socket.join(matchId);
//         socket.data.matchId = matchId;

//         console.log("📥 entrou na sala:", matchId, "socket:", socket.id);
//       });

//       // 🔥 8. DISCONNECT
//       socket.on("disconnect", async () => {
//         try {
//           await prismaCliente.loggedUsers.update({
//             where: { userId },
//             data: {
//               isOnline: false,
//               lastSeen: new Date(),
//             },
//           });

//           io?.emit("user-offline", { userId, userHashPublic });

//           console.log(`🔴 Usuário ${userId} (${userHashPublic}) OFFLINE`);
//         } catch (error) {
//           console.error("Erro ao desconectar usuário:", error);
//         }
//       });
//     } catch (error) {
//       console.error("Erro no socket:", error);
//       socket.disconnect();
//     }
//   });
// };

// export const getSocketIO = () => {
//   if (!io) {
//     throw new Error("Socket.IO não foi inicializado");
//   }
//   return io;
// };
import { Server } from "http";
import jwt from "jsonwebtoken";
import { Socket, Server as SocketIOServer } from "socket.io";
import { prismaCliente } from "../database/prismaCliente";

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

  io.on("connection", async (socket: Socket) => {
    console.log("🔌 Nova conexão socket:", socket.id);

    // ✅ 1. PEGAR TOKEN (PADRÃO FINAL)
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log("❌ Socket sem token");
      socket.disconnect();
      return;
    }

    // ✅ 2. VALIDAR TOKEN
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      console.log("❌ Token inválido");
      socket.disconnect();
      return;
    }

    const userId = decoded.sub;

    if (!userId) {
      console.log("❌ Token sem userId");
      socket.disconnect();
      return;
    }

    try {
      // ✅ 3. BUSCAR USUÁRIO
      const user = await prismaCliente.user.findUnique({
        where: { id: userId },
        select: { id: true, userHashPublic: true },
      });

      if (!user) {
        console.log("❌ Usuário não encontrado");
        socket.disconnect();
        return;
      }

      const userHashPublic = user.userHashPublic;

      console.log("✅ Usuário autenticado:", userId, userHashPublic);

      // ✅ 4. MARCAR ONLINE
      await prismaCliente.loggedUsers.upsert({
        where: { userId },
        update: {
          isOnline: true,
          lastSeen: new Date(),
        },
        create: {
          userId,
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      // ✅ 5. EMITIR ONLINE GLOBAL
      io?.emit("user-online", { userId, userHashPublic });

      // ✅ 6. SALAS PADRÃO
      socket.join(userId); // privado
      socket.join(userHashPublic); // público

      console.log("📌 entrou nas salas:", userId, userHashPublic);

      // ✅ 7. ENTRAR NA SALA DO CHAT (matchId)
      socket.on("join-send-message", (matchId: string) => {
        socket.join(matchId);
        socket.data.matchId = matchId;

        console.log("💬 entrou na sala do chat:", matchId);
      });

      // ✅ 8. DISCONNECT
      socket.on("disconnect", async () => {
        try {
          await prismaCliente.loggedUsers.update({
            where: { userId },
            data: {
              isOnline: false,
              lastSeen: new Date(),
            },
          });

          io?.emit("user-offline", { userId, userHashPublic });

          console.log("🔴 Usuário offline:", userId);
        } catch (error) {
          console.error("Erro no disconnect:", error);
        }
      });
    } catch (error) {
      console.error("Erro geral no socket:", error);
      socket.disconnect();
    }
  });
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.IO não foi inicializado");
  }
  return io;
};
