import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";
import { rateLimit } from "express-rate-limit";
import http from "http";
// import { sslOptions } from "../config/readySslOptions";
import path from "path";

import { client, subscriberClient } from "./lib/redis";
import { initializeSocket } from "./lib/socket";
import { routes } from "./routes";
import { monitorExpiredPosts } from "./work/postExpirationListener";

const app = express();

// Servir arquivos estáticos (ex: imagens)
app.use("/image", express.static(path.resolve(__dirname, "..", "image")));

const port = process.env.PORT || 3000;

// Limite de requisições
const limitRequest = rateLimit({
  windowMs: 10000,
  max: 30,
});
// app.use(limitRequest);

// app.set("trust proxy", 1);

// CORS — ajuste conforme necessário para seu front
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

// Middleware para evitar conflito com o webhook do Stripe
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(routes);

// Middleware global de erros
app.use(
  (
    error: Error,
    request: Request,
    response: Response,
    nextFunction: NextFunction
  ) => {
    console.error("Erro capturado:", error);

    if (error instanceof Error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(500).json({
      status: "error",
      message: "Erro interno do servidor",
    });
  }
);

const server = http.createServer(app);

// Inicializa o Socket.IO
initializeSocket(server);

// Função de inicialização global
async function bootstrap() {
  try {
    // Garante que Redis esteja conectado
    if (!client.isOpen) await client.connect();
    if (!subscriberClient.isOpen) await subscriberClient.connect();

    console.log("✅ Redis conectado com sucesso.");

    // Inicializa o monitoramento de expiração
    monitorExpiredPosts();

    // Inicia o servidor HTTP
    server.listen(Number(port), "0.0.0.0", () => {
      console.log([
        `🚀 Servidor iniciado na porta ${port}`,
        `🌐 http://localhost:${port}/`,
      ]);
    });
  } catch (err) {
    console.error("❌ Erro durante inicialização do servidor:", err);
    process.exit(1);
  }
}

bootstrap();
