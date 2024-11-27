// multerCloudinary.ts
import { Request } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

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
    folder: `user-posts/${request.id_client}`,
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

export const uploadWithCloudinary = multer({ storage });
export const uploadWithCloudinaryPosts = multer({ storage: storagePosts });
