import { Request, Response } from "express";
import Joi from "joi";
import { CreateAccountWithGoogleUseCase } from "./create-account-with-googleUseCase";

const schema = Joi.object().keys({
  token: Joi.string().required(),
  language: Joi.string().required(),
  codeLanguage: Joi.string().required(),
  countryLanguage: Joi.string().required(),
});

export class CreateAccountWithGoogleController {
  private useCase: CreateAccountWithGoogleUseCase;

  constructor() {
    this.useCase = new CreateAccountWithGoogleUseCase();
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

      const { token, language, codeLanguage, countryLanguage } = value;
      console.log("REQUEST BODY:", value);

      const result = await this.useCase.execute(
        token,
        language,
        codeLanguage,
        countryLanguage,
      );

      return response.json(result);
    } catch (error: any) {
      console.error("GOOGLE AUTH ERROR");
      console.error(error);

      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode || "ERR_INTERNAL_SERVER_ERROR",
        method: "post",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
