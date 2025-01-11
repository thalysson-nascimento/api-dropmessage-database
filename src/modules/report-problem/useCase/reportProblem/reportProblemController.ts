import { Request, Response } from "express";
import Joi from "joi";
import { ReportProblemUseCase } from "./reportProblemUseCase";

interface RepostProblem {
  matchId: string;
  reportProblem: string;
}

const schema = Joi.object().keys({
  matchId: Joi.string().required(),
  reportProblem: Joi.string().required(),
});

export class ReportProblemController {
  private useCase: ReportProblemUseCase;

  constructor() {
    this.useCase = new ReportProblemUseCase();
  }

  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);
    const userId = request.id_client;

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const { matchId, reportProblem } = value as RepostProblem;

      const typeReportProblem = [
        "not-want-talk",
        "abusive-image",
        "inappropriate-photos-or-names",
        "child-sexual-exploration",
      ];

      const existReportProblem = typeReportProblem.includes(reportProblem);

      if (!existReportProblem) {
        throw new Error("Tipo de problema invalido");
      }

      const result = await this.useCase.execute(userId, matchId, reportProblem);
      return response.json(result);
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
