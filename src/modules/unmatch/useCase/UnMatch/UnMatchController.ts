import { Request, Response } from "express";
import Joi from "joi";
import { UnMatchUseCase } from "./UnMatchUseCase";

const schema = Joi.object().keys({
  matchId: Joi.string().required(),
});

export class UnMatchController {
  private useCase: UnMatchUseCase;

  constructor() {
    this.useCase = new UnMatchUseCase();
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

    try {
      const { matchId } = value;
      const result = await this.useCase.execute(userId, matchId);
      return response.json(result);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode || "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
