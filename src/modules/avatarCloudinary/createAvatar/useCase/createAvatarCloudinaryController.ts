import { Request, Response } from "express";
import Joi from "joi";
import { CreateAvatarCloudinaryUseCase } from "./createAvatarCloudinaryUseCase";

export interface AboutUser {
  dateOfBirth: string;
  gender: string;
  interests: string;
}

const schema = Joi.object({
  dateOfBirth: Joi.string().required().min(10).max(10).trim(),
  gender: Joi.string().required().min(5).max(12).trim(),
  interests: Joi.string().required().min(5).max(12).trim(),
}).unknown(false);

export class CreateAvatarCloudinaryController {
  private useCase: CreateAvatarCloudinaryUseCase;

  constructor() {
    this.useCase = new CreateAvatarCloudinaryUseCase();
  }

  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    const file = request.file as Express.Multer.File;
    const { value, error } = schema.validate(request.body);

    if (error) {
      return response.status(400).json({
        message: error.details[0].message,
        code: "ERR_BADREQUEST",
        method: "post",
        statusCode: 400,
      });
    }

    if (!file) {
      return response.status(400).json({
        error: "Nenhuma imagem foi enviada",
      });
    }

    const { dateOfBirth, gender, interests } = value as AboutUser;

    if (gender !== "homem" && gender !== "mulher" && gender !== "não binario") {
      return response.status(400).json({
        error:
          "opção invalida para genero, que só podem ser homem, mulher ou não binario",
      });
    }

    if (
      interests !== "homem" &&
      interests !== "mulher" &&
      interests !== "ambos"
    ) {
      return response.status(400).json({
        error:
          "opção invalida para interesse, que só podem ser homem, mulher ou não binario",
      });
    }

    try {
      const createAvatar = await this.useCase.execute(userId, file, {
        dateOfBirth,
        gender,
        interests,
      });
      return response.status(201).json(createAvatar);
    } catch (error: any) {
      return response.status(400).json({ error: error.message });
    }
  }
}
