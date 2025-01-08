import { Request, Response } from "express";
import Joi from "joi";
import { LoggerTrackActionUseCase } from "./loggerTrackActionUseCase";

interface TrackAction {
  pageView: string;
  event: string;
  category: string;
  message: string;
  statusCode: number;
  level: string;
  label?: string;
}

const schema = Joi.object({
  pageView: Joi.string().required(),
  event: Joi.string().required(),
  category: Joi.string().required(),
  message: Joi.string().required(),
  statusCode: Joi.number().required(),
  level: Joi.string().required(),
  label: Joi.string().optional(),
});

export class LoggerTrackActionController {
  private useCase: LoggerTrackActionUseCase;

  constructor() {
    this.useCase = new LoggerTrackActionUseCase();
  }

  async handle(request: Request, response: Response) {
    try {
      const userId = request.id_client;
      const { value, error } = schema.validate(request.body);

      if (error) {
        return response.status(400).json({
          message: error.details[0].message,
          code: "ERR_BADREQUEST",
          method: "post",
          statusCode: 400,
        });
      }

      const { pageView, event, category, message, statusCode, level, label } =
        value as TrackAction;

      await this.useCase.execute(userId, {
        pageView,
        event,
        category,
        message,
        statusCode,
        level,
        label,
      });

      return response.status(200).json({
        message: message,
        code: statusCode,
      });
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
