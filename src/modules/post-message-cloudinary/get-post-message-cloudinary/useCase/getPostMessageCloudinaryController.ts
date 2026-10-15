import { Request, Response } from "express";
import { GetPostMessageCloudinaryUseCase } from "./getPostMessageCloudinaryUseCase";

const MAX_PAGE_SIZE = 100;

export class GetPostMessageCloudinaryController {
  private useCase = new GetPostMessageCloudinaryUseCase();

  async handle(req: Request, res: Response) {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
    if ((req.query.page !== undefined && typeof req.query.page !== "string") ||
        (req.query.limit !== undefined && typeof req.query.limit !== "string") ||
        !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) ||
        limit < 1 || limit > MAX_PAGE_SIZE || !Number.isSafeInteger((page - 1) * limit)) {
      return res.status(400).json({ message: "page deve ser um inteiro positivo e limit deve ser um inteiro entre 1 e 100" });
    }
    try {
      return res.status(200).json(await this.useCase.execute(req.id_client, page, limit));
    } catch (error) {
      console.error("Erro ao buscar feed", error);
      return res.status(500).json({ message: "Erro ao buscar feed" });
    }
  }
}
