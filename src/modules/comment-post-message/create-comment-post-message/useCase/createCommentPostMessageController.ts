import { Request, Response } from "express";
import Joi from "joi";
import { CreateCommentPostMessageUseCase } from "./createCommentPostMessageUseCase";

const schema = Joi.object().keys({
  id: Joi.string().uuid().required(),
  content: Joi.string().max(50).required(),
});

export class CreateCommentPostMessageController {
  private useCase: CreateCommentPostMessageUseCase;

  constructor() {
    this.useCase = new CreateCommentPostMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    const id = request.params.id || request.body.id || request.query.id;
    const { content } = request.body;
    const userId = request.id_client;

    const { error } = schema.validate({ id, content });

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const result = await this.useCase.execute({ id, userId, content });
      return response.json(result);
    } catch (error: any) {
      return response.status(error.statusCode || 500).json({
        message: error.message,
        code: error.statusCode === 403 ? "ERR_FORBIDDEN" : (error.statusCode === 404 ? "ERR_NOTFOUND" : (error.statusCode === 409 ? "ERR_CONFLICT" : "ERR_INTERNAL_SERVER_ERROR")),
        method: "post",
        statusCode: error.statusCode || 500,
      });
    }
  }
}
