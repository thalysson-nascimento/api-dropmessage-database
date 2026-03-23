import { Request, Response } from "express";
import Joi from "joi";
import { GetSendMessageUseCase } from "./getSendMessageUseCase";

const schema = Joi.object({
  matchId: Joi.string().uuid().required(), // Valida matchId como UUID (ajuste se não for necessário)
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

export class GetSendMessageController {
  private useCase: GetSendMessageUseCase;

  constructor() {
    this.useCase = new GetSendMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    const { error, value } = schema.validate(request.query);

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
      });
    }

    const { matchId, page = 1, limit = 15 } = value;
    const userId = request.id_client;

    try {
      const result = await this.useCase.execute(matchId, userId, page, limit);
      return response.json(result);
    } catch (error: any) {
      return response.status(400).json({
        message: error.message,
        code: "ERR_GET_MESSAGES",
      });
    }
  }
}
