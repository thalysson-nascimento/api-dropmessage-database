import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

interface Payload {
  sub: string;
}

export async function ensureAuthenticateUserAdmin(
  request: Request,
  response: Response,
  nextFunction: NextFunction,
) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return response.status(401).json({ message: "Token vazio" });
  }

  const [, token] = authHeader.split(" ");

  try {
    const { sub } = verify(token, process.env.JWT_SECRET as string) as Payload;

    request.id_client = sub;

    if (!request.id_client) {
      return response.status(404).json({ message: "Usuário não encontrado" });
    }

    return nextFunction();
  } catch (error) {
    return response.status(401).json({ message: "Token invalido" });
  }
}
