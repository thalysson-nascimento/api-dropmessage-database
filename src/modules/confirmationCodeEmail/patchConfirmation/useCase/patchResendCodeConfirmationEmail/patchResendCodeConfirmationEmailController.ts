import { Request, Response } from "express";
import { PatchResendCodeConfirmationEmailUseCase } from "./patchResendCodeConfirmationEmailUseCase";

export class PatchResendCodeConfirmationEmailController {
  private useCase: PatchResendCodeConfirmationEmailUseCase;

  constructor() {
    this.useCase = new PatchResendCodeConfirmationEmailUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    try {
      // Implemente a lógica aqui
      const result = await this.useCase.execute(userId);
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
