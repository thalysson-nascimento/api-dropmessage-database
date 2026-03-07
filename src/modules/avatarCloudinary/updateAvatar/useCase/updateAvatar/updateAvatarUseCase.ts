import streamifier from "streamifier";
import cloudinary from "../../../../../config/cloudinary";
import { getImageUrl } from "../../../../../service/cloudinary.service";
import { UpdateAvatarRepository } from "./updateAvatarRepository";

interface IRequest {
  userId: string;
  fileBuffer: Buffer;
  fileName: string;
}

export class UpdateAvatarUseCase {
  private repository: UpdateAvatarRepository;

  constructor() {
    this.repository = new UpdateAvatarRepository();
  }

  async execute({ userId, fileBuffer, fileName }: IRequest) {
    const avatar = await this.repository.findAvatarByUserId(userId);

    // Mantém o mesmo public_id se já existir
    const publicId = avatar?.image || `user-avatar/${userId}`;

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          resource_type: "image",
          type: "authenticated",
        },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });

    const avatarData = {
      image: uploadResult.public_id,
      fileName,
      format: uploadResult.format,
      optimizedSize: uploadResult.bytes,
    };

    if (avatar) {
      await this.repository.updateAvatar(userId, avatarData);
    } else {
      await this.repository.createAvatar({
        userId,
        ...avatarData,
      });
    }

    await this.repository.setUserUploadAvatar(userId);

    return {
      message: "Avatar updated successfully",
      avatarUrl: getImageUrl(uploadResult.public_id, uploadResult.version),
    };
  }
}
