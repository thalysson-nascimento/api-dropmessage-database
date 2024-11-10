import { Request, Response } from "express";
import { StaticLikePreferencesUseCase } from "./staticLikePreferencesUseCase";

export class StaticLikePreferencesController {
  private useCase: StaticLikePreferencesUseCase;

  constructor() {
    this.useCase = new StaticLikePreferencesUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;

    if (!userId) {
      return response.status(400).json({ error: "User ID is required" });
    }

    try {
      const stats = await this.useCase.execute(userId);
      return response.json(stats);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: "Internal server error" });
    }
  }
}
