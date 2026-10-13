import { ImageUploadFile } from "../@types/imageUpload";
import { UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import { validateImageUpload } from "./imageUploadValidation";
import cloudinary from "../config/cloudinary";

export const uploadAuthenticatedImage = (
  file: ImageUploadFile,
  folder = "user-posts",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    validateImageUpload(file);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        type: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const uploadAuthenticatedImageAvatar = (
  file: ImageUploadFile,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    validateImageUpload(file);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "user-avatar",
        resource_type: "image",
        type: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const generateAuthenticatedImageUrl = (
  publicId: string,
  version: number | undefined,
  isPremium: boolean,
) => {
  const transformation = isPremium
    ? []
    : [
        {
          effect: "pixelate:40",
        },
        {
          effect: "blur:1000",
        },
      ];

  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    transformation,
    version,
  });
};

export const getImageUrl = (publicId: string, version?: number) => {
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    version,
  });
};

export const getTemporaryAuthenticatedImageUrl = (
  publicId: string,
  format: string,
  expiresAt: number,
) =>
  cloudinary.utils.private_download_url(publicId, format, {
    resource_type: "image",
    type: "authenticated",
    expires_at: expiresAt,
  });

export const getImageAvatarAI = (publicId: string, version?: number) => {
  return cloudinary.url(publicId, {
    folder: "ai",
    type: "upload",
    secure: true,
    version,
    fetch_format: "auto",
  });
};

export const deleteAuthenticatedImage = (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { type: "authenticated", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
  });
};

export function getAvatarThumbnailUrl(avatar: { thumbnail?: string | null; thumbnailVersion?: number | null } | null | undefined) {
  return avatar?.thumbnail ? getImageUrl(avatar.thumbnail, avatar.thumbnailVersion ?? undefined) : null;
}
