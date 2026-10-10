import { createHash } from "crypto";
import createHttpError from "http-errors";
import { z } from "zod";
import { getSocketIO, emitGlobalChatEvent } from "../../lib/socket";
import { isAllowedImageMimeType } from "../../service/imageUploadValidation";
import { deleteDirectUploadAsset, getDirectUploadAsset, directUploadConfig, DIRECT_UPLOAD_FORMATS, DIRECT_UPLOAD_MAX_BYTES,
  signDirectImageUpload, verifyCloudinaryWebhook } from "../../service/cloudinaryDirectUpload.service";
import { GlobalChatRepository } from "../global-chat/globalChatRepository";
import { serializeMessage } from "../global-chat/globalChatUseCase";
import { DirectUploadRepository } from "./directUploadRepository";

const authorizeSchema = z.object({
  clientRequestId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  bytes: z.number().int().positive().max(DIRECT_UPLOAD_MAX_BYTES),
  mimeType: z.string().refine(isAllowedImageMimeType),
  content: z.string().trim().max(2000).optional(),
  replyToId: z.string().uuid().optional(),
  viewOnce: z.boolean().default(false),
  expiresInSeconds: z.number().int().min(60).max(7 * 24 * 3600).default(24 * 3600),
}).strict();
const uuid = z.string().uuid();
const assetSchema = z.object({
  notification_type: z.literal("upload"),
  public_id: z.string().min(1).max(300),
  asset_id: z.string().min(1).max(200),
  resource_type: z.enum(["image", "video", "raw"]),
  type: z.enum(["authenticated", "private", "upload"]),
  bytes: z.number().int().nonnegative(),
  created_at: z.string().datetime({ offset: true }),
  format: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
}).passthrough();

export class DirectUploadUseCase {
  private repository = new DirectUploadRepository();
  private messages = new GlobalChatRepository();

  async authorize(userId: string, body: unknown) {
    const parsed = authorizeSchema.safeParse(body);
    if (!parsed.success) throw createHttpError(400, "Dados do upload inválidos: UUID, imagem de até 5 MB e expiração entre 60 e 604800 segundos são obrigatórios");
    directUploadConfig(); // Fail before creating an intent if deployment is not configured.
    const input = parsed.data;
    const session = await this.repository.authorize({
      userId, clientRequestId: input.clientRequestId,
      fileName: input.fileName.replace(/^.*[\\/]/, "").replace(/[\x00-\x1f\x7f]/g, "") || "image",
      declaredBytes: input.bytes,
      requestHash: createHash("sha256").update(JSON.stringify(input)).digest("hex"),
      content: input.content || undefined, replyToId: input.replyToId,
      viewOnce: input.viewOnce, expirationSeconds: input.expiresInSeconds,
    });
    const status = await this.serializeStatus(session);
    return { ...status, upload: status.status === "PENDING" ? signDirectImageUpload(session) : null };
  }

  async serializeStatus(session: any) {
    const timedOut = session.status === "PENDING" && session.expiresAt <= new Date();
    const expired = timedOut && Date.now() > session.expiresAt.getTime() + 20 * 60_000;
    const row = session.status === "PUBLISHED" && session.messageId ? await this.messages.findMessage(session.messageId) : null;
    const visible = row && !row.deletedAt && (!row.expiresAt || row.expiresAt > new Date());
    return {
      uploadId: session.id, clientRequestId: session.clientRequestId,
      status: expired ? "EXPIRED" : timedOut ? "AWAITING_CONFIRMATION" : session.status,
      expiresAt: session.expiresAt,
      messageId: session.messageId,
      message: visible ? { ...serializeMessage(row, session.userId), uploadId: session.id } : null,
      unavailable: session.status === "PUBLISHED" && !visible,
      errorCode: expired ? "UPLOAD_EXPIRED" : session.rejectionReason,
    };
  }

  async status(id: string, userId: string) {
    if (!uuid.safeParse(id).success) throw createHttpError(400, "ID de upload inválido");
    const session = await this.repository.findOwned(id, userId);
    if (!session) throw createHttpError(404, "Upload não encontrado");
    return this.serializeStatus(session);
  }

  async cancel(id: string, userId: string) {
    if (!uuid.safeParse(id).success) throw createHttpError(400, "ID de upload inválido");
    const session = await this.repository.cancel(id, userId);
    this.emitStatus(session);
    // The signed grant cannot be revoked; a late signed webhook will delete the asset.
    return this.serializeStatus(session);
  }

  private emitStatus(session: any) {
    try {
      getSocketIO().to(session.userId).emit("upload:status", {
        uploadId: session.id, clientRequestId: session.clientRequestId, status: session.status,
        messageId: session.messageId, errorCode: session.rejectionReason,
      });
    } catch { /* HTTP status recovers when the socket is unavailable. */ }
  }

  async reconcile(id: string, userId: string) {
    if (!uuid.safeParse(id).success) throw createHttpError(400, "ID de upload inválido");
    const session = await this.repository.findOwned(id, userId);
    if (!session) throw createHttpError(404, "Upload não encontrado");
    if (session.status !== "PENDING" || Date.now() > session.expiresAt.getTime() + 20 * 60_000)
      return this.serializeStatus(session);
    let metadata;
    try { metadata = await getDirectUploadAsset(session.publicId); }
    catch (error: any) {
      if (error.http_code === 404 || error.error?.http_code === 404) return this.serializeStatus(session);
      throw createHttpError(503, "Não foi possível confirmar o upload; tente novamente mais tarde");
    }
    const parsed = assetSchema.safeParse({ ...metadata, notification_type: "upload" });
    if (!parsed.success || parsed.data.public_id !== session.publicId)
      throw createHttpError(503, "Metadados de confirmação indisponíveis");
    await this.processAsset(parsed.data);
    return this.status(id, userId);
  }

  async webhook(rawBody: Buffer, timestamp?: string, signature?: string) {
    if (!Buffer.isBuffer(rawBody)) throw createHttpError(400, "Webhook requer corpo JSON bruto");
    verifyCloudinaryWebhook(rawBody, timestamp, signature);
    let body: any;
    try { body = JSON.parse(rawBody.toString("utf8")); }
    catch { throw createHttpError(400, "JSON inválido"); }
    if (body?.notification_type !== "upload") return { received: true, ignored: true };
    const parsed = assetSchema.safeParse(body);
    if (!parsed.success) throw createHttpError(400, "Metadados do Cloudinary inválidos");
    return this.processAsset(parsed.data);
  }

  private async processAsset(asset: z.infer<typeof assetSchema>) {
    if (!/^direct-uploads\/global-chat\/[0-9a-f-]{36}$/.test(asset.public_id))
      return { received: true, ignored: true };
    const allowed = asset.resource_type === "image" && asset.type === "authenticated" &&
      DIRECT_UPLOAD_FORMATS.includes(asset.format || "") && asset.bytes > 0 && asset.bytes <= DIRECT_UPLOAD_MAX_BYTES &&
      Number.isSafeInteger(asset.width) && Number.isSafeInteger(asset.height) &&
      asset.width! > 0 && asset.height! > 0 && asset.width! * asset.height! <= 100_000_000;
    const result = await this.repository.complete(asset.public_id,
      { assetId: asset.asset_id, bytes: asset.bytes, format: asset.format || "",
        uploadedAt: new Date(asset.created_at), resourceType: asset.resource_type, deliveryType: asset.type },
      allowed ? undefined : "INVALID_ASSET");
    if (result.ignored) return { received: true, ignored: true };
    if (result.cleanup) {
      // Only remove the exact server-generated ID of a known canceled/rejected session.
      await deleteDirectUploadAsset(asset.public_id, asset.resource_type, asset.type);
      await this.repository.markCleanupComplete(asset.public_id, asset.resource_type, asset.type);
    }
    if (result.published && result.message && result.session) {
      // Public payload never reveals view-once media. The uploader reconciles by uploadId.
      emitGlobalChatEvent("global-chat:new-message", {
        ...serializeMessage(result.message, ""), uploadId: result.session.id,
      });
    }
    if (result.session) this.emitStatus(result.session);
    return { received: true };
  }
}
