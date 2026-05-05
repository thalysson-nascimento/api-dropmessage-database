import { Request, Response } from "express";
import Joi from "joi";
import { CreateUserDescriptionUseCase } from "./createUserDescriptionUseCase";

const schema = Joi.object().keys({
  userDescription: Joi.string().max(200).required(),
});

export class CreateUserDescriptionController {
  useCase: CreateUserDescriptionUseCase;

  constructor() {
    this.useCase = new CreateUserDescriptionUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);
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
      const { userDescription } = value as { userDescription: string };

      const result = await this.useCase.execute(userId, userDescription);

      return response.json(result);
    } catch (error: any) {
      return response.status(error.status || 500).json({
        message: error.message,
        code: error.status ? "ERR_BAD_REQUEST" : "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.status || 500,
      });
    }
  }
}
