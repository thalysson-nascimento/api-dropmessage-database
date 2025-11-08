import { Request, Response } from "express";
import Joi from "joi";
import { generateUniqueHash } from "../../../../utils/generateUserHasPublic";
import { CreateUserUseCase } from "./createUserUseCase";

interface UserAdmin {
  name: string;
  email: string;
  password: string;
}

const schema = Joi.object({
  name: Joi.string().required().min(6).max(32).trim(),
  email: Joi.string().required().email().min(6).max(64).trim(),
  password: Joi.string().required().min(6).max(32).trim(),
}).unknown(false);

export class CreateUserController {
  async handle(request: Request, response: Response) {
    const { value, error } = schema.validate(request.body);

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "POST",
        statusCode: 400,
      });
    }

    const { name, email, password } = value as UserAdmin;
    const createUserUseCase = new CreateUserUseCase();

    try {
      const result = await createUserUseCase.execute({
        name,
        email,
        userHashPublic: generateUniqueHash(),
        password,
      });

      // ✅ resposta correta com status e body
      return response.status(201).json({
        message: "Usuário criado com sucesso!",
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 409;

      return response.status(status).json({
        message: err.message || "Erro ao criar usuário.",
        code: "ERR_CONFLICT",
        method: "POST",
        statusCode: status,
      });
    }
  }
}
