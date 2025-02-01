import { Request, Response } from "express";
import Joi from "joi";
import { CredentialsAccountWithGoogleUseCase } from "./credentialsAccountWithGoogleUseCase";

const schema = Joi.object().keys({
  token: Joi.string().required(),
});

export class CredentialsAccountWithGoogleController {
  private useCase: CredentialsAccountWithGoogleUseCase;

  constructor() {
    this.useCase = new CredentialsAccountWithGoogleUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const { value, error } = schema.validate(request.body);

      if (error) {
        return response.status(400).json({
          message: error.details[0].message,
          code: "ERR_BADREQUEST",
          method: "post",
          statusCode: 400,
        });
      }

      const { token } = value;
      const result = await this.useCase.execute(token);
      return response.status(200).json(result);
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
