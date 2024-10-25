import crypto from "crypto";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { resolve } from "path";

const tmpFolder = resolve(__dirname, "..", "..", "tmp");

export default {
  tmpFolder,
  upload(folder: string) {
    return {
      storage: multer.diskStorage({
        destination: resolve(__dirname, "..", "..", folder),
        filename: (request, file, callback) => {
          const fileHash = crypto.randomBytes(16).toString("hex");
          const fileName = `${fileHash}-${file.originalname}`;

          return callback(null, fileName);
        },
      }),
      fileFilter: (
        request: Request,
        file: Express.Multer.File,
        callback: FileFilterCallback
      ) => {
        if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
          callback(null, true);
          return;
        }

        callback(null, false);
        callback(new Error("permitido apenas arquivos com a extensão .png!"));
      },
    };
  },
};
