import { Request, Response } from "express";
import { UpdateViewCardFreeTrialUseCase } from "./update-view-card-free-trialUseCase";

export class UpdateViewCardFreeTrialController {
  private useCase: UpdateViewCardFreeTrialUseCase;

  constructor() {
    this.useCase = new UpdateViewCardFreeTrialUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const userId = request.id_client;
      const result = await this.useCase.execute(userId);
      return response.json(result);
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
