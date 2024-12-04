import { Request, Response } from "express";
import { UpdateAdMobVideoRewardUseCase } from "./updateAdMobVideoRewardUseCase";

export class UpdateAdMobVideoRewardController {
  private useCase = new UpdateAdMobVideoRewardUseCase();

  constructor() {
    this.useCase = new UpdateAdMobVideoRewardUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    console.log("====>", request.id_client);
    return response.json(userId);
  }
}
