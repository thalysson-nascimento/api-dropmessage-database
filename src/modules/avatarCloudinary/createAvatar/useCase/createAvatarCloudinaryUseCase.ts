import { randomBytes } from "crypto";
import createHttpError from "http-errors";
import path from "path";
import { CreateAvatarCloudinaryRepository } from "./createAvatarCloudinaryRepository";

export interface AboutUser {
  dateOfBirth: string;
  gender: string;
  interests: string;
}

export class CreateAvatarCloudinaryUseCase {
  private repository: CreateAvatarCloudinaryRepository;

  constructor() {
    this.repository = new CreateAvatarCloudinaryRepository();
  }

  async execute(
    userId: string,
    file: Express.Multer.File,
    aboutUser: AboutUser
  ) {
    const existUserAvatarCloudinary =
      await this.repository.verifyCreateAvatarCloudinary(userId);

    if (existUserAvatarCloudinary) {
      throw createHttpError(402, "avatar existente");
    }

    if (!file || !file.path) {
      throw new Error("O arquivo é obrigatório para criar o avatar.");
    }

    const extension = path.extname(file.originalname);
    const hash = randomBytes(16).toString("hex");
    const hashedFileName = `${hash}${extension}`;

    file.originalname = hashedFileName;

    await this.repository.createAboutUser(userId, {
      dateOfBirth: aboutUser.dateOfBirth,
      gender: aboutUser.gender,
      interests: aboutUser.interests,
    });

    const createAvatar = await this.repository.saveAvatar(userId, file);
    await this.repository.updateStatusUploadAvatar(userId);

    return createAvatar;
  }
}
