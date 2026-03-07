import { UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary";

export const uploadAuthenticatedImage = (
  file: Express.Multer.File
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "user-posts",
        resource_type: "image",
        type: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const uploadAuthenticatedImageAvatar = (
  file: Express.Multer.File
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "user-avatar",
        resource_type: "image",
        type: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const generateAuthenticatedImageUrl = (
  publicId: string,
  isPremium: boolean
) => {
  const transformation = isPremium
    ? []
    : [
        {
          effect: "blur:2000",
        },
      ];

  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    transformation,
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
