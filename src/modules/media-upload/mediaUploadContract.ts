import { z } from "zod";
import createHttpError from "http-errors";
import { DIRECT_UPLOAD_FORMATS, DIRECT_UPLOAD_MAX_BYTES } from "../../service/cloudinaryDirectUpload.service";

export const thumbnailFormats = ["jpg", "jpeg", "png", "webp"];
const uuidV4 = z.string().uuid().refine(value => value[14] === "4", "UUID-v4 obrigatório");
const mimeFormats: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"], "image/jpg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"],
  "image/gif": ["gif"], "image/bmp": ["bmp"], "image/x-ms-bmp": ["bmp"], "image/tiff": ["tiff", "tif"],
  "image/heic": ["heic", "heif"], "image/heif": ["heif", "heic"], "image/avif": ["avif"],
  "application/octet-stream": DIRECT_UPLOAD_FORMATS,
};
export const assetInput = z.object({
  role: z.enum(["image", "thumbnail"]), fileName: z.string().min(1).max(255),
  bytes: z.number().int().positive(), mimeType: z.string(),
  width: z.number().int().positive().optional(), height: z.number().int().positive().optional(),
}).strict();
const base = { clientRequestId: uuidV4, assets: z.array(assetInput).min(1).max(2) };
export const mediaIntentSchema = z.discriminatedUnion("domain", [
  z.object({ ...base, domain: z.literal("avatar"), metadata: z.object({
    dateOfBirth: z.string().trim().length(10), gender: z.enum(["male", "female", "notBinary"]), interests: z.enum(["male", "female", "both"]),
  }).strict() }).strict(),
  z.object({ ...base, domain: z.literal("avatar-update"), metadata: z.object({}).strict() }).strict(),
  z.object({ ...base, domain: z.literal("timeline"), metadata: z.object({
    expirationTimer: z.enum(["addThirtyMin", "addOneHour", "addOneday", "addOneWeek"]),
  }).strict() }).strict(),
  z.object({ ...base, domain: z.literal("private-chat"), metadata: z.object({ matchId: z.string().uuid(), viewOnce: z.boolean() }).strict() }).strict(),
]);
export type MediaIntent = z.infer<typeof mediaIntentSchema>;
export const cloudAssetSchema = z.object({
  notification_type: z.literal("upload"), public_id: z.string().max(300), asset_id: z.string().min(1),
  resource_type: z.enum(["image", "video", "raw"]), type: z.enum(["authenticated", "private", "upload"]),
  bytes: z.number().int().nonnegative(), format: z.string().optional(), width: z.number().optional(), height: z.number().optional(),
  version: z.number().int().positive().optional(), created_at: z.string().datetime({ offset: true }),
}).passthrough();
export type CloudAsset = z.infer<typeof cloudAssetSchema>;
export function mediaError(status: number, code: string, message: string) { return createHttpError(status, message, { code }); }
export function parseMediaIntent(body: unknown): MediaIntent {
  const result = mediaIntentSchema.safeParse(body);
  if (!result.success) throw mediaError(400, "INVALID_UPLOAD_INPUT", result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
  const input = result.data;
  const roles = input.assets.map(a => a.role);
  const avatar = input.domain === "avatar" || input.domain === "avatar-update";
  if (new Set(roles).size !== roles.length || !roles.includes("image") || roles.length !== (avatar ? 2 : 1) || (avatar && !roles.includes("thumbnail")))
    throw mediaError(422, "INVALID_ASSET_ROLES", "Avatar exige image + thumbnail; timeline e chat aceitam apenas image");
  for (const asset of input.assets) {
    if (asset.bytes > DIRECT_UPLOAD_MAX_BYTES) throw mediaError(413, "IMAGE_TOO_LARGE", "Cada imagem deve ter no máximo 5 MB");
    const extension = asset.fileName.split(".").pop()?.toLowerCase();
    const formats = mimeFormats[asset.mimeType.toLowerCase()];
    if (!formats || !extension || !formats.includes(extension) || (asset.role === "thumbnail" && !thumbnailFormats.includes(extension)))
      throw mediaError(415, "UNSUPPORTED_IMAGE", "Extensão, MIME ou formato de imagem inválido");
    if (/[\\/\x00-\x1f\x7f]/.test(asset.fileName)) throw mediaError(400, "INVALID_FILE_NAME", "Informe somente o nome do arquivo");
  }
  return { ...input, assets: [...input.assets].sort((a,b) => a.role.localeCompare(b.role)) };
}
export function validateConfirmedAsset(remote: CloudAsset, role: string) {
  if (remote.resource_type !== "image" || remote.type !== "authenticated" || !DIRECT_UPLOAD_FORMATS.includes(remote.format || "") ||
      remote.bytes <= 0 || remote.bytes > DIRECT_UPLOAD_MAX_BYTES || !Number.isSafeInteger(remote.width) || !Number.isSafeInteger(remote.height) ||
      remote.width! <= 0 || remote.height! <= 0 || remote.width! * remote.height! > 100_000_000)
    return "INVALID_ASSET";
  if (role === "thumbnail" && (!thumbnailFormats.includes(remote.format!) || remote.width !== remote.height || remote.width! > 160)) return "INVALID_THUMBNAIL";
  return undefined;
}
