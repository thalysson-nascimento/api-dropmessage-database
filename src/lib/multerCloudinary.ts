// multerCloudinary.ts
import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { isAllowedImageMimeType, validateImageUpload } from "../service/imageUploadValidation";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storageMemory = multer.memoryStorage();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "user-avatar",
    allowed_formats: ["jpg", "jpeg", "png"],
    resource_type: "image",
    transformation: [
      {
        width: 800,
        quality: "auto:good",
        crop: "limit",
      },
    ],
  }),
});

const storagePosts = new CloudinaryStorage({
  cloudinary,
  params: async (request: Request) => ({
    folder: `user-posts/`,
    allowed_formats: ["jpg", "jpeg", "png"],
    resource_type: "image",
    type: "private",
    transformation: [
      {
        width: 800,
        quality: "auto:good",
        crop: "limit",
      },
    ],
  }),
});

export const upload = multer({
  storage: storageMemory,
  fileFilter: (_request, file, callback) => {
    if (!isAllowedImageMimeType(file.mimetype)) return callback(createHttpError(415, "Tipo de imagem não permitido"));
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 50,
    parts: 51,
    fieldSize: 64 * 1024,
    fieldNameSize: 100,
    headerPairs: 100,
  },
});

export const uploadWithCloudinary = multer({ storage });
export const uploadWithCloudinaryPosts = multer({ storage: storagePosts });

export function validateUploadedImage(request: Request, _response: Response, next: NextFunction) {
  try {
    if (request.file) validateImageUpload(request.file);
    next();
  } catch (error) { next(error); }
}
