import { Request, Response } from "express";
import { MediaUploadUseCase } from "./mediaUploadUseCase";
export class MediaUploadController {
  private useCase = new MediaUploadUseCase();
  private error(response: Response, error: any) {
    const status = error.statusCode || 503;
    return response.status(status).json({ code: error.statusCode ? error.code || "MEDIA_SERVICE_UNAVAILABLE" : "MEDIA_SERVICE_UNAVAILABLE",
      message: status >= 500 ? "Serviço de mídia indisponível; tente novamente" : error.message });
  }
  async authorize(req: Request, res: Response) {
    try { return res.status(201).json(await this.useCase.authorize(req.id_client, req.body)); }
    catch (error) { return this.error(res, error); }
  }
  authorizeDomain(domain: "avatar" | "avatar-update" | "timeline") {
    return async (req: Request, res: Response) => {
      if (req.body?.domain && req.body.domain !== domain) return res.status(400).json({ code: "INVALID_UPLOAD_INPUT", message: "Domínio incompatível com o endpoint" });
      try { return res.status(201).json(await this.useCase.authorize(req.id_client, { ...req.body, domain })); }
      catch (error) { return this.error(res, error); }
    };
  }
  async status(req: Request, res: Response) {
    try { return res.json(await this.useCase.status(req.params.uploadId, req.id_client)); }
    catch (error) { return this.error(res, error); }
  }
  async reconcile(req: Request, res: Response) {
    try { if (req.body && Object.keys(req.body).length) return res.status(400).json({ code: "UNEXPECTED_BODY", message: "Reconciliação não aceita corpo" });
      return res.json(await this.useCase.reconcile(req.params.uploadId, req.id_client)); }
    catch (error) { return this.error(res, error); }
  }
  async cancel(req: Request, res: Response) {
    try { return res.json(await this.useCase.cancel(req.params.uploadId, req.id_client)); }
    catch (error) { return this.error(res, error); }
  }
}
