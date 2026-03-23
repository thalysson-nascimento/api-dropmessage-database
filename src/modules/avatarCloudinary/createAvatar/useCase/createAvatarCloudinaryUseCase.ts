import { randomBytes } from "crypto";
import createHttpError from "http-errors";
import path from "path";
import {
  getImageUrl,
  uploadAuthenticatedImageAvatar,
} from "../../../../service/cloudinary.service";
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
    aboutUser: AboutUser,
  ) {
    const existUserAvatarCloudinary =
      await this.repository.verifyCreateAvatarCloudinary(userId);

    if (existUserAvatarCloudinary) {
      throw createHttpError(402, "avatar existente");
    }

    if (!file) {
      throw new Error("O arquivo é obrigatório para criar o avatar.");
    }

    const extension = path.extname(file.originalname);
    const hash = randomBytes(16).toString("hex");
    const hashedFileName = `${hash}${extension}`;

    file.originalname = hashedFileName;

    const uploadClaoudinary = await uploadAuthenticatedImageAvatar(file);
    const { public_id } = uploadClaoudinary;

    await this.repository.createAboutUser(userId, {
      dateOfBirth: aboutUser.dateOfBirth,
      gender: aboutUser.gender,
      interests: aboutUser.interests,
    });

    const createAvatar = await this.repository.saveAvatar(
      userId,
      file,
      public_id,
    );
    await this.repository.updateStatusUploadAvatar(userId);

    return {
      ...createAvatar,
      image: getImageUrl(createAvatar.image),
    };
  }
}
