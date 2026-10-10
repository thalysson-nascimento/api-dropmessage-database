import { Request, Response } from "express";
import Joi from "joi";
import { CreateSendMessageUseCase } from "./createSendMessageUseCase";

interface CreateSendMessage {
  matchId: string;
  userHashPublic: string;
  content?: string;
  viewOnce?: boolean | string;
}

const schema = Joi.object({
  matchId: Joi.string().required(),
  userHashPublic: Joi.string().required(),
  content: Joi.string().allow("").optional(),
  viewOnce: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
}).unknown(false);

const viewSchema = Joi.object({
  matchId: Joi.string().required(),
}).unknown(false);

export class CreateSendMessageController {
  private useCase: CreateSendMessageUseCase;

  constructor() {
    this.useCase = new CreateSendMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body, {
      convert: false,
    });
    const userId = request.id_client;

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    const { matchId, userHashPublic, content, viewOnce } =
      value as CreateSendMessage;

    try {
      const result = await this.useCase.execute(
        userId,
        matchId,
        userHashPublic,
        content,
        request.file,
        viewOnce,
      );

      return response.status(request.file ? 201 : 200).json(result);
    } catch (error) {
      const statusCode = (error as any).statusCode || 500;
      return response.status(statusCode).json({
        message: (error as Error).message,
        code: statusCode === 403 ? "ERR_FORBIDDEN" : "ERR_SEND_MESSAGE",
      });
    }
  }

  async view(request: Request, response: Response) {
    const { value, error } = viewSchema.validate(request.body);
    if (error) {
      return response.status(400).json({ message: error.details[0].message });
    }

    try {
      const result = await this.useCase.viewOnceMessage(
        request.params.messageId,
        value.matchId,
        request.id_client,
      );
      return response.json(result);
    } catch (error) {
      const statusCode = (error as any).statusCode || 500;
      return response.status(statusCode).json({
        message: (error as Error).message,
        code: statusCode === 403 ? "ERR_FORBIDDEN" : "ERR_VIEW_MESSAGE",
      });
    }
  }
}
