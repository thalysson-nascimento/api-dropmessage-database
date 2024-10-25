import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
import { rateLimit } from "express-rate-limit";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
// import { sslOptions } from "../config/readySslOptions";
import { env } from "./env";
import { routes } from "./routes";

import { monitorExpiredPosts } from "./work/postExpirationListener";

const app = express();
const port = env.PORT;

const limitRiquest = rateLimit({
  windowMs: 10000,
  max: 30,
});

app.use(limitRiquest);

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(routes);

app.use(
  (
    error: Error,
    request: Request,
    response: Response,
    nextFunction: NextFunction
  ) => {
    if (error instanceof Error) {
      return response.status(400).json({
        message: error.message,
      });
    }

    return response.status(500).json({
      status: "error",
      message: "error interno do servidor",
    });
  }
);

// const server = https.createServer(sslOptions, app);
// TODO: posteriormente gerar os arquivos de chaves de segurança ssl
// tambem importar o https quando estiver com as chaves de segurança ssl
const server = http.createServer(app);
const io = new SocketIOServer(server);

io.on("connection", (socket) => {
  console.log("Novo cliente conectado");

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Inicializa o monitoramento de expiração
monitorExpiredPosts(); // <=== monitorando a expiração com redis

server.listen(port, async () => {
  console.log([`servidor iniciado na porta ${port}`, `localhost:${port}/`]);
});

export { io };
