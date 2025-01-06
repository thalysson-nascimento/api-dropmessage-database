import { Request, Response } from "express";
import Joi from "joi";
import { CreateUserDescriptionCompleteUseCase } from "./createUserDescriptionCompleteUseCase";

const schema = Joi.object().keys({
  userDescription: Joi.string().max(200).required(),
});

export class CreateUserDescriptionCompleteController {
  private useCase: CreateUserDescriptionCompleteUseCase;

  constructor() {
    this.useCase = new CreateUserDescriptionCompleteUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BAD_REQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const { userDescription } = value as { userDescription: string };

      const result = await this.useCase.execute(userDescription);

      return response.json(result);
    } catch (error: any) {
      return response.status(error.statusCode).json({
        message: error.message,
        code: error.statusCode || "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.statusCode,
      });
    }
  }
}
