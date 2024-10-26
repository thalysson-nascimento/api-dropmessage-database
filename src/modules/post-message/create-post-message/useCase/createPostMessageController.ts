import { randomBytes } from "crypto";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { CreatePostMessageUseCase } from "./createPostMessageUseCase";

export class CreatePostMessageController {
  async handle(request: Request, response: Response) {
    const { expirationTimer } = request.body;
    const createPostMessageUseCase = new CreatePostMessageUseCase();
    const userId = "bda9c19f-da79-4d7e-a553-f3489028d332";

    const file = request.file as Express.Multer.File;

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
      "../../../../../image/post",
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
        const post = await createPostMessageUseCase.execute({
          fileImage: hashedFileName,
          expirationTimer,
          userId,
        });

        return response.status(201).json(post);
      } catch (error: any) {
        return response.status(400).json({ error: error.message });
      }
    });
  }
}
