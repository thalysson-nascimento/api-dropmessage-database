import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { GetUserUseCase } from "./getUserUseCase";

const prisma = new PrismaClient();

export class GetUserController {
  async handle(request: Request, response: Response) {
    try {
      const getUserUseCase = new GetUserUseCase();
      const userId = request.id_client;

      const result = await getUserUseCase.execute(userId);
      return response.json(result);
    } catch (error) {
      console.error("Erro no processamento:", error);
      return response.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  }
}
