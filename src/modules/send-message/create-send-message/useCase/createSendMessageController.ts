import { Request, Response } from "express";
import Joi from "joi";
import { CreateSendMessageUseCase } from "./createSendMessageUseCase";

interface CreateSendMessage {
  matchId: string;
  userHashPublic: string;
  content: string;
}

const schema = Joi.object().keys({
  matchId: Joi.string().required(),
  userHashPublic: Joi.string().required(),
  content: Joi.string().required(),
});

export class CreateSendMessageController {
  private useCase: CreateSendMessageUseCase;

  constructor() {
    this.useCase = new CreateSendMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);
    const userId = request.id_client;

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    const { matchId, userHashPublic, content } = value as CreateSendMessage;

    try {
      const result = await this.useCase.execute(
        userId,
        matchId,
        userHashPublic,
        content
      );

      return response.json(result);
    } catch (error) {
      console.log(error);
      return response.status(409).json({
        message: error,
        code: "ERR_CONFLICT",
        method: "post",
        statusCode: 409,
      });
    }
  }
}
