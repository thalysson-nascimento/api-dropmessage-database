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
  gender: Joi.string().required().trim(),
  interests: Joi.string().required().trim(),
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

    console.log("============", userId, "============");
    console.log("============", request.body, "============");
    console.log("============", request.file, "============");
    console.log("============", value, "============");

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
    console.log("============", value, "============");

    if (gender !== "male" && gender !== "female" && gender !== "notBinary") {
      return response.status(400).json({
        error:
          "opção invalida para genero, que só podem ser male, female ou não binario",
      });
    }

    if (
      interests !== "male" &&
      interests !== "female" &&
      interests !== "both"
    ) {
      return response.status(400).json({
        error:
          "opção invalida para interesse, que só podem ser male, female ou não binario",
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
      console.log("============", error, "============");
      return response.status(400).json({ error: error.message });
    }
  }
}
