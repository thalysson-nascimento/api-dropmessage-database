import { NextFunction, Request, Response } from "express";
export function requireMediaJson(req: Request, res: Response, next: NextFunction) {
  if (!req.is("application/json")) return res.status(415).json({ code: "DIRECT_MEDIA_UPLOAD_REQUIRED", message: "Use POST /media/uploads e envie os arquivos diretamente ao Cloudinary" });
  return next();
}
