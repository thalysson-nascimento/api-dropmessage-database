import { Request, Response } from "express";
import Joi from "joi";
import { AuthUserUseCase } from "./authUserUseCase";

interface AuthUserAdmin {
  email: string;
  password: string;
}

const schema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
}).unknown(false);

export class AuthUserController {
  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    try {
      const authUserUseCase = new AuthUserUseCase();
      const { email, password } = value as AuthUserAdmin;
      const result = await authUserUseCase.execute({ email, password });

      return response.json(result);
    } catch (error) {
      return response.status(404).json({
        message: error,
        code: "ERR_NOTFOUND",
        method: "post",
        statusCode: 404,
      });
    }
  }
}
