import { Request, Response } from "express";
import { AboutMeRepository } from "./createOrUpdateProfessionRepository";
import { CreateOrUpdateProfessionUseCase } from "./createOrUpdateProfessionUseCase";

export class CreateOrUpdateProfessionController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    const { profession } = request.body;

    console.log("User ID:", userId);
    console.log("Profession:", profession);

    if (!userId) {
      return response.status(401).json({ error: "User not found" });
    }
    try {
      const aboutMeRepository = new AboutMeRepository();
      const useCase = new CreateOrUpdateProfessionUseCase(aboutMeRepository);
      const aboutMe = await useCase.execute(userId, profession);
      return response.status(200).json(aboutMe);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
