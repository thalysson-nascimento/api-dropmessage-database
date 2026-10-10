import { randomUUID } from "crypto";
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
    const { avatarUploadRevision } = await this.repository.reserveRevision(userId);
    const publicId = `user-avatar/${randomUUID()}`;

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: false,
          invalidate: true,
          resource_type: "image",
          type: "authenticated",
        },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });

    const avatarData = {
      image: uploadResult.public_id,
      version: uploadResult.version,
      fileName,
      format: uploadResult.format,
      optimizedSize: uploadResult.bytes,
    };

    try { await this.repository.publish(userId, avatarUploadRevision, avatarData); }
    catch (error) { await this.repository.queueCleanup(uploadResult.public_id); throw error; }

    return {
      message: "Avatar updated successfully",
      avatarUrl: getImageUrl(uploadResult.public_id, uploadResult.version),
      thumbnailUrl: null,
    };
  }
}
