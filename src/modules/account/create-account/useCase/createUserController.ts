import { Request, Response } from "express";

import Joi from "joi";
import { CreateUserUseCase } from "./createUserUseCase";

interface UserAdmin {
  name: string;
  email: string;
  password: string;
}

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
}).unknown(false);

export class CreateUserController {
  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);

    const createUserUseCase = new CreateUserUseCase();

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    const { name, email, password } = value as UserAdmin;

    try {
      const result = await createUserUseCase.execute({
        name,
        email,
        password,
      });

      return response.json(result);
    } catch (error) {
      return response.status(409).json({
        message: error,
        code: "ERR_CONFLICT",
        method: "post",
        statusCode: 409,
      });
    }
  }
}
