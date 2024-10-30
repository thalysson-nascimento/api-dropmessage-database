import { Request, Response } from "express";
import { GetAvatarUseCase } from "./getAvatarUseCase";

export class GetAvatarController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    const getAvatarUseCase = new GetAvatarUseCase();

    try {
      const avatar = await getAvatarUseCase.execute(userId);

      return response.status(200).json(avatar);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
