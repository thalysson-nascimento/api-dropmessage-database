// multerCloudinary.ts
import { Request } from "express";
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
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadWithCloudinary = multer({ storage });
export const uploadWithCloudinaryPosts = multer({ storage: storagePosts });
