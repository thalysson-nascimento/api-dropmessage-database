import { Request, Response } from "express";
import Joi from "joi";
import { GetCodeConfirmationEmailUseCase } from "./getCodeConfirmationEmailUseCase";

const schema = Joi.object({
  codeConfirmationEmail: Joi.number().required(),
});

export class GetCodeConfirmationEmailController {
  private useCase: GetCodeConfirmationEmailUseCase;

  constructor() {
    this.useCase = new GetCodeConfirmationEmailUseCase();
  }

  async handle(request: Request, response: Response) {
    const { error } = schema.validate(request.body);

    if (error) {
      return response.status(400).json({ error: error.details[0].message });
    }

    const userId = request.id_client;
    const { codeConfirmationEmail } = request.body;
    const codeConfirmation = parseInt(codeConfirmationEmail, 10);

    try {
      const result = await this.useCase.execute(userId, codeConfirmation);
      return response.status(200).json(result);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
