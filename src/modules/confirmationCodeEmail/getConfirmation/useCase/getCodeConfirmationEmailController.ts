import { Request, Response } from "express";
import Joi from "joi";
import { GetCodeConfirmationEmailUseCase } from "./getCodeConfirmationEmailUseCase";

// Ajuste: Permite que o Joi trate o valor como string e converta para número
const schema = Joi.object({
  codeConfirmationEmail: Joi.number().required(), // Valor numérico requerido
});

export class GetCodeConfirmationEmailController {
  private useCase: GetCodeConfirmationEmailUseCase;

  constructor() {
    this.useCase = new GetCodeConfirmationEmailUseCase();
  }

  async handle(request: Request, response: Response) {
    const { codeConfirmationEmail } = request.query;

    // Ajuste: Passa `codeConfirmationEmail` como string para validação
    const { error } = schema.validate({
      codeConfirmationEmail: Number(codeConfirmationEmail), // Converte para número
    });

    if (error) {
      return response.status(400).json({ error: error.details[0].message });
    }

    const userId = request.id_client;
    const codeConfirmation = parseInt(codeConfirmationEmail as string, 10);

    try {
      const result = await this.useCase.execute(userId, codeConfirmation);
      return response.status(200).json(result);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
