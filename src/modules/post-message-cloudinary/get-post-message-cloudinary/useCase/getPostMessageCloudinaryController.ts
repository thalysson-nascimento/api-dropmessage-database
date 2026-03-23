import { Request, Response } from "express";
import { GetPostMessageCloudinaryUseCase } from "./getPostMessageCloudinaryUseCase";

export class GetPostMessageCloudinaryController {
  private useCase = new GetPostMessageCloudinaryUseCase();

  async handle(req: Request, res: Response) {
    try {
      const userId = req.id_client;

      const page = Number(req.query.page) || 1;

      const limit = Number(req.query.limit) || 10;

      if (page <= 0 || limit <= 0) {
        return res.status(400).json({
          message: "page e limit devem ser maiores que zero",
        });
      }

      const result = await this.useCase.execute(userId, page, limit);

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao buscar feed",
      });
    }
  }
}
