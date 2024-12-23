import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

interface Payload {
  sub: string;
}

export async function ensureAuthenticateUserAdmin(
  request: Request,
  response: Response,
  nextFunction: NextFunction
) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return response.status(401).json({ message: "Token vazio" });
  }

  const [, token] = authHeader.split(" ");

  try {
    const { sub } = verify(
      token,
      "dff2f370b3331305c51daafbdf7d2b6e-user-admin"
    ) as Payload;

    request.id_client = sub;

    if (!request.id_client) {
      return response.status(404).json({ message: "Usuário não encontrado" });
    }

    return nextFunction();
  } catch (error) {
    return response.status(401).json({ message: "Token invalido" });
  }
}
