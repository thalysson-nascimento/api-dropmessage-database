import { randomBytes } from "crypto";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { CreateAvatarUseCase } from "./createAvatarUseCase";

export class CreateAvatarController {
  async handle(request: Request, response: Response) {
    const userId = request.id_client;
    const createAvatarUsecase = new CreateAvatarUseCase();

    const file = request.file as Express.Multer.File;
    const { dateOfBirth, gender, interests } = request.body;

    if (!file) {
      return response.status(400).json({
        error: "Nenhuma imagem foi enviada",
      });
    }

    const extension = path.extname(file.originalname);
    const hash = randomBytes(16).toString("hex");
    const hashedFileName = `${hash}${extension}`;

    const tempFilePath = file.path;
    const destinationPath = path.join(
      __dirname,
      "../../../../../image/user-avatar",
      hashedFileName
    );

    const directory = path.dirname(destinationPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.rename(tempFilePath, destinationPath, async (err) => {
      if (err) {
        console.error("Erro ao renomear o arquivo:", err);
        return response.status(500).json({ error: "Erro ao salvar o arquivo" });
      }

      try {
        const post = await createAvatarUsecase.execute({
          fileImage: hashedFileName,
          dateOfBirth: dateOfBirth,
          gender: gender,
          interests: interests,
          userId,
        });

        return response.status(201).json(post);
      } catch (error: any) {
        return response.status(400).json({ error: error.message });
      }
    });
  }
}
