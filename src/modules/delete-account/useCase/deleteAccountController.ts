import { Request, Response } from "express";
import { DeleteAccountUseCase } from "./deleteAccountUseCase";

export class DeleteAccountController {
  private useCase: DeleteAccountUseCase;

  constructor() {
    this.useCase = new DeleteAccountUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;

    try {
      const result = await this.useCase.execute(userId);

      return response.json(result);
    } catch (error) {
      console.error(error);
      return response.status(404).json({
        message: error || "Not Found",
        code: "ERR_NOTFOUND",
        method: "get",
        statusCode: 404,
      });
    }
  }
}
