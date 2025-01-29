import { Request, Response } from "express";
import { FisrtPublicationRegisterGoldFreeUseCase } from "./fisrtPublicationRegisterGoldFreeUseCase";

export class FisrtPublicationRegisterGoldFreeController {
  private useCase: FisrtPublicationRegisterGoldFreeUseCase;

  constructor() {
    this.useCase = new FisrtPublicationRegisterGoldFreeUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const userId = request.id_client;
      const priceId = request.body.priceId;
      console.log({ userId, priceId });
      // return response.status(200).json({ userId, priceId });
      const result = await this.useCase.execute(userId, priceId);
      return response.status(200).json(result);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode || "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
