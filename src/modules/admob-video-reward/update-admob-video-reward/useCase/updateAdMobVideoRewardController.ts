import { Request, Response } from "express";
import { UpdateAdMobVideoRewardUseCase } from "./updateAdMobVideoRewardUseCase";

export class UpdateAdMobVideoRewardController {
  private useCase: UpdateAdMobVideoRewardUseCase;

  constructor() {
    this.useCase = new UpdateAdMobVideoRewardUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const userId = request.id_client;

      const result = await this.useCase.execute(userId);
      return response.status(201).json(result);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
