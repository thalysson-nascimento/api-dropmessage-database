import express, { NextFunction, Request, Response } from "express";
import { upload, validateUploadedImage } from "../../lib/multerCloudinary";
import { DirectUploadUseCase } from "./directUploadUseCase";

export const cloudinaryWebhookBodyParser = express.raw({ type: "application/json", limit: "64kb" });

// No multipart bytes are buffered by the global chat API after the transition.
export function requireGlobalChatJson(request: Request, response: Response, next: NextFunction) {
  if (request.is("multipart/form-data")) {
    return response.status(415).json({ code: "DIRECT_UPLOAD_REQUIRED",
      message: "Use POST /global-chat/uploads e envie a imagem diretamente ao Cloudinary" });
  }
  next();
}

// Keep old clients working during rollout; enable DIRECT_ONLY after the new frontend is released.
export function globalChatUploadInput(request: Request, response: Response, next: NextFunction) {
  if (process.env.CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY === "true") return requireGlobalChatJson(request, response, next);
  upload.single("file")(request, response, error => {
    if (error) return next(error);
    validateUploadedImage(request, response, next);
  });
}

export class DirectUploadController {
  private useCase = new DirectUploadUseCase();

  private error(response: Response, error: any) {
    const status = error.statusCode || 500;
    return response.status(status).json({ message: status >= 500 && status !== 503 ? "Falha ao processar upload; tente novamente" : error.message });
  }

  async authorize(request: Request, response: Response) {
    try {
      return response.status(201).json(await this.useCase.authorize(request.id_client, request.body));
    } catch (error) { return this.error(response, error); }
  }

  async status(request: Request, response: Response) {
    try { return response.json(await this.useCase.status(request.params.uploadId, request.id_client)); }
    catch (error) { return this.error(response, error); }
  }

  async cancel(request: Request, response: Response) {
    try { return response.json(await this.useCase.cancel(request.params.uploadId, request.id_client)); }
    catch (error) { return this.error(response, error); }
  }

  async reconcile(request: Request, response: Response) {
    try { return response.json(await this.useCase.reconcile(request.params.uploadId, request.id_client)); }
    catch (error) { return this.error(response, error); }
  }

  async webhook(request: Request, response: Response) {
    try {
      return response.status(200).json(await this.useCase.webhook(request.body,
        request.get("X-Cld-Timestamp"), request.get("X-Cld-Signature")));
    } catch (error) { return this.error(response, error); }
  }
}
