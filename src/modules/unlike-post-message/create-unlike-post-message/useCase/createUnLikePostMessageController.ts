import { Request, Response } from "express";
import Joi from "joi";
import { CreateUnLikePostMessageUseCase } from "./createUnLikePostMessageUseCase";

interface UnLikePost {
  postMessageId: string;
}

const schema = Joi.object({
  postMessageId: Joi.string().required().trim(),
});

export class CreateUnLikePostMessageController {
  private useCase: CreateUnLikePostMessageUseCase;

  constructor() {
    this.useCase = new CreateUnLikePostMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    const userId = request.id_client;
    const { postMessageId } = value as UnLikePost;

    try {
      const createUnLikePostMessage = await this.useCase.execute(
        postMessageId,
        userId
      );

      return response.status(201).json(createUnLikePostMessage);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
