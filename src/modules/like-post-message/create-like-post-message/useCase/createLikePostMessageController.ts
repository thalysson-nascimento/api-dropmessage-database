import { Request, Response } from "express";
import { CreateLikePostMessageUseCase } from "./createLikePostMessageUseCase";

export class CreateLikePostMessageController {
  async handle(request: Request, response: Response) {
    console.log("Handling request for CreateLikePostMessageController");

    const { postId } = request.body;
    const userId = request.id_client;

    console.log("Received data:", { postId, userId });

    try {
      const likePostMessageUseCase = new CreateLikePostMessageUseCase();
      const result = await likePostMessageUseCase.execute({ postId, userId });

      return response.status(201).json(result);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return response.status(statusCode).json({ error: error.message });
    }
  }
}
