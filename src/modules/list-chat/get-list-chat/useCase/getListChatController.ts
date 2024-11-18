import { Request, Response } from "express";
import { GetListChatUseCase } from "./getListChatUseCase";

export class GetListChatController {
  private useCase: GetListChatUseCase;

  constructor() {
    this.useCase = new GetListChatUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;

    try {
      const chats = await this.useCase.execute(userId);
      return response.status(200).json(chats);
    } catch (error) {
      console.error(error);
      return response.status(400).json({ error: error });
    }
  }
}
