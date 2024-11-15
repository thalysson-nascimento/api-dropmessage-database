import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
import { rateLimit } from "express-rate-limit";
import http from "http";
// import { sslOptions } from "../config/readySslOptions";
import path from "path";
import { routes } from "./routes";

import { initializeSocket } from "./lib/socket";
import { monitorExpiredPosts } from "./work/postExpirationListener";

const app = express();
// Adicione esta linha para servir arquivos estáticos do diretório image
app.use("/image", express.static(path.resolve(__dirname, "..", "image")));

const port = process.env.PORT || 3000;

const limitRiquest = rateLimit({
  windowMs: 10000,
  max: 30,
});

app.use(limitRiquest);

// app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

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

const server = http.createServer(app);

// Inicialize o Socket.IO com o servidor
initializeSocket(server);

// Inicializa o monitoramento de expiração
monitorExpiredPosts(); // <=== monitorando a expiração com redis

server.listen(Number(port), "0.0.0.0", async () => {
  console.log([`servidor iniciado na porta ${port}`, `localhost:${port}/`]);
});
