import { Request, Response } from "express";
import Joi from "joi";
import { CreateGenerateTipsWithGpt4oMiniUseCase } from "./createGenerateTipsWithGpt4oMiniUseCase";

const schema = Joi.object().keys({
  matchId: Joi.string().required(),
});

export class CreateGenerateTipsWithGpt4oMiniController {
  useCase: CreateGenerateTipsWithGpt4oMiniUseCase;

  constructor() {
    this.useCase = new CreateGenerateTipsWithGpt4oMiniUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.query);
    const userId = request.id_client;

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BAD_REQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const { matchId } = value as {
        matchId: string;
      };

      const result = await this.useCase.execute(matchId, userId);

      return response.json(result);
    } catch (error: any) {
      return response.status(409).json({
        message: error,
        code: "ERR_CONFLICT",
        method: "post",
        statusCode: 409,
      });
    }
  }
}
