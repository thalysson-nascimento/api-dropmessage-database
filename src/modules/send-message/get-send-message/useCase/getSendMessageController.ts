// import { Request, Response } from "express";
// import Joi from "joi";
// import { GetSendMessageUseCase } from "./getSendMessageUseCase";

// interface CreateSendMessage {
//   matchId: string;
// }

// const schema = Joi.object().keys({
//   matchId: Joi.string().required(),
// });

// export class GetSendMessageController {
//   private useCase: GetSendMessageUseCase;
//   constructor() {
//     this.useCase = new GetSendMessageUseCase();
//   }

//   async handle(request: Request, response: Response) {
//     const { value, error } = schema.validate(request.query);
//     const userId = request.id_client;
//     const page = Number(request.query.page) || 1;
//     const limit = Number(request.query.limit) || 10;

//     if (error) {
//       return response.status(400).json({
//         message: error.details[0].message,
//         code: "ERR_BADREQUEST",
//         method: "post",
//         statusCode: 400,
//       });
//     }

//     const { matchId } = value as CreateSendMessage;

//     try {
//       const result = await this.useCase.execute(matchId, userId, page, limit);

//       return response.json(result);
//     } catch (error) {
//       console.log(error);
//       return response.status(404).json({
//         message: error,
//         code: "ERR_NOTFOUND",
//         method: "post",
//         statusCode: 404,
//       });
//     }
//   }
// }
import { Request, Response } from "express";
import Joi from "joi";
import { GetSendMessageUseCase } from "./getSendMessageUseCase";

const schema = Joi.object({
  matchId: Joi.string().uuid().required(), // Valida matchId como UUID (ajuste se não for necessário)
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10),
});

export class GetSendMessageController {
  private useCase: GetSendMessageUseCase;

  constructor() {
    this.useCase = new GetSendMessageUseCase();
  }

  async handle(request: Request, response: Response) {
    // Valida `request.query` com Joi
    const { error, value } = schema.validate(request.query);

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "get",
        statusCode: 400,
      });
    }

    const { matchId, page, limit } = value; // Dados validados da query
    const userId = request.id_client;

    try {
      const result = await this.useCase.execute(matchId, userId, page, limit);

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
