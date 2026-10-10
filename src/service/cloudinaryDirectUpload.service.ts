import { createHash, timingSafeEqual } from "crypto";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary";

export const DIRECT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const DIRECT_UPLOAD_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "heic", "heif", "avif"];
export const DIRECT_UPLOAD_TTL_SECONDS = 15 * 60;

export function directUploadConfig() {
  const config = cloudinary.config();
  let notificationUrl = process.env.CLOUDINARY_NOTIFICATION_URL;
  if (!notificationUrl && process.env.BASE_URL) {
    try { notificationUrl = new URL("/cloudinary/webhook", process.env.BASE_URL).toString(); }
    catch { /* Report configuration failure below. */ }
  }
  if (!config.cloud_name || !config.api_key || !config.api_secret || !notificationUrl)
    throw createHttpError(503, "Upload direto indisponível: configure o Cloudinary e CLOUDINARY_NOTIFICATION_URL");
  let url: URL;
  try { url = new URL(notificationUrl); }
  catch { throw createHttpError(503, "CLOUDINARY_NOTIFICATION_URL inválida"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/cloudinary/webhook")
    throw createHttpError(503, "Configure uma URL HTTPS pública terminada em /cloudinary/webhook");
  return { cloudName: config.cloud_name, apiKey: config.api_key, apiSecret: config.api_secret, notificationUrl: url.toString() };
}

export function signDirectImageUpload(session: { publicId: string; createdAt: Date; expiresAt: Date }) {
  const config = directUploadConfig();
  const params: Record<string, string> = {
    timestamp: String(Math.floor(session.createdAt.getTime() / 1000)),
    public_id: session.publicId,
    type: "authenticated",
    overwrite: "false",
    allowed_formats: DIRECT_UPLOAD_FORMATS.join(","),
    notification_url: config.notificationUrl,
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    fields: { ...params, api_key: config.apiKey, signature: cloudinary.utils.api_sign_request(params, config.apiSecret) },
    maxBytes: DIRECT_UPLOAD_MAX_BYTES,
    allowedFormats: DIRECT_UPLOAD_FORMATS,
  };
}

// The signature covers exact bytes, not a reserialized JSON object.
export function verifyCloudinaryWebhook(rawBody: Buffer, timestampInput?: string, signature?: string) {
  const secret = process.env.CLOUDINARY_WEBHOOK_API_SECRET || cloudinary.config().api_secret;
  if (!secret) throw createHttpError(503, "Segredo do webhook Cloudinary não configurado");
  const timestamp = Number(timestampInput);
  const now = Math.floor(Date.now() / 1000);
  if (!timestampInput || !/^\d+$/.test(timestampInput) || !Number.isSafeInteger(timestamp) || timestamp > now + 60 || timestamp < now - 7200 ||
      !signature || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(signature))
    throw createHttpError(401, "Assinatura do webhook inválida ou expirada");
  const expected = createHash(signature.length === 64 ? "sha256" : "sha1")
    .update(rawBody).update(timestampInput).update(secret).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex")))
    throw createHttpError(401, "Assinatura do webhook inválida");
}

export function deleteDirectUploadAsset(publicId: string, resourceType = "image", deliveryType = "authenticated") {
  if (!["image", "video", "raw"].includes(resourceType) || !["authenticated", "private", "upload"].includes(deliveryType))
    throw createHttpError(400, "Tipo de recurso inválido");
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: deliveryType, invalidate: true });
}

export function getDirectUploadAsset(publicId: string) {
  return cloudinary.api.resource(publicId, { resource_type: "image", type: "authenticated" });
}
