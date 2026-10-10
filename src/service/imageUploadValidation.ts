import createHttpError from "http-errors";
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const mimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/x-ms-bmp", "image/tiff", "image/heic", "image/heif", "image/avif", "image/heic-sequence", "image/heif-sequence", "application/octet-stream"]);
export const isAllowedImageMimeType = (type: string) => mimeTypes.has(type.toLowerCase());
// File names and MIME types come from the client; inspect bytes before upload.
export function validateImageUpload(file: Express.Multer.File) {
  const b = file.buffer;
  if (!Buffer.isBuffer(b) || !b.length) throw createHttpError(400, "Arquivo de imagem vazio ou inválido");
  if (b.length > MAX_IMAGE_UPLOAD_BYTES) throw createHttpError(413, "A imagem deve ter no máximo 5 MB");
  if (!isAllowedImageMimeType(file.mimetype)) throw createHttpError(415, "Tipo de imagem não permitido");
  const starts = (bytes: number[]) => b.length >= bytes.length && bytes.every((v, i) => b[i] === v);
  const png = starts([137,80,78,71,13,10,26,10]) && b.length >= 33 && b.toString("ascii",12,16) === "IHDR";
  const jpeg = starts([255,216,255]) && b.length >= 4;
  const gif = b.length >= 13 && ["GIF87a","GIF89a"].includes(b.toString("ascii",0,6));
  const webp = b.length >= 16 && b.toString("ascii",0,4) === "RIFF" && b.toString("ascii",8,12) === "WEBP" && ["VP8 ","VP8L","VP8X"].includes(b.toString("ascii",12,16));
  const bmp = starts([66,77]) && b.length >= 26;
  const tiff = b.length >= 8 && (starts([73,73,42,0]) || starts([77,77,0,42]));
  const heif = b.length >= 16 && b.toString("ascii",4,8) === "ftyp" && ["heic","heix","hevc","hevx","mif1","msf1","avif","avis"].includes(b.toString("ascii",8,12));
  if (!png && !jpeg && !gif && !webp && !bmp && !tiff && !heif) throw createHttpError(415, "O conteúdo enviado não é uma imagem permitida");
  // Keep stored media format consistent with the actual bytes (mobile clients may use octet-stream).
  const brand = heif ? b.toString("ascii", 8, 12) : "";
  file.mimetype = png ? "image/png" : jpeg ? "image/jpeg" : gif ? "image/gif" :
    webp ? "image/webp" : bmp ? "image/bmp" : tiff ? "image/tiff" :
    ["avif", "avis"].includes(brand) ? "image/avif" : "image/heic";
}
