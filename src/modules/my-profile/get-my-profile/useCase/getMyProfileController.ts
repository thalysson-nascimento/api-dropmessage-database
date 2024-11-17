import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { GetMyProfileUseCase } from "./getMyProfileUseCase";

const prisma = new PrismaClient();

export class GetMyProfileController {
  async handle(request: Request, response: Response) {
    try {
      const getMyProfileUseCase = new GetMyProfileUseCase();
      const userId = request.id_client;

      const result = await getMyProfileUseCase.execute(userId);
      return response.json(result);
    } catch (error) {
      console.error("Erro no processamento:", error);
      return response.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  }
}
