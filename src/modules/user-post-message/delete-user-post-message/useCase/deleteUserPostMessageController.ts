import { Request, Response } from "express";
import Joi from "joi";
import { DeleteUserPostMessageUseCase } from "./deleteUserPostMessageUseCase";

const schema = Joi.object().keys({
  id: Joi.string().uuid().required(),
});

export class DeleteUserPostMessageController {
  private useCase: DeleteUserPostMessageUseCase;

  constructor() {
    this.useCase = new DeleteUserPostMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    const id = request.params.id || request.body.id || request.query.id;
    const userId = request.id_client;

    const { error } = schema.validate({ id });

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "delete",
        statusCode: 400,
      });
    }

    try {
      const result = await this.useCase.execute({ id, userId });
      return response.json(result);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode === 403 ? "ERR_FORBIDDEN" : (error.statusCode === 404 ? "ERR_NOTFOUND" : "ERR_INTERNAL_SERVER_ERROR"),
        method: "delete",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
