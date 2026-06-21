import { Request, Response } from "express";
import Joi from "joi";
import { CheckCommentUnlockStatusUseCase } from "./checkCommentUnlockStatusUseCase";

const schema = Joi.object().keys({
  id: Joi.string().uuid().required(),
});

export class CheckCommentUnlockStatusController {
  private useCase: CheckCommentUnlockStatusUseCase;

  constructor() {
    this.useCase = new CheckCommentUnlockStatusUseCase();
  }

  async handle(request: Request, response: Response) {
    const id = request.params.id || request.body.id || request.query.id;
    const userId = request.id_client;

    const { error } = schema.validate({ id });

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "get",
        statusCode: 400,
      });
    }

    try {
      const result = await this.useCase.execute({ id, userId });
      return response.json(result);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode === 409 ? "ERR_CONFLICT" : (error.statusCode === 404 ? "ERR_NOTFOUND" : "ERR_INTERNAL_SERVER_ERROR"),
        method: "get",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
