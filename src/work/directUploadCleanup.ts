import { DirectUploadRepository } from "../modules/direct-upload/directUploadRepository";
import { deleteDirectUploadAsset } from "../service/cloudinaryDirectUpload.service";

const repository = new DirectUploadRepository();
let running = false;

export async function cleanupDirectUploads() {
  if (running) return;
  running = true;
  try {
    const sessions = await repository.pendingCleanup();
    for (const session of sessions) {
      if (!/^direct-uploads\/global-chat\/[0-9a-f-]{36}$/.test(session.publicId)) continue;
      try {
        await deleteDirectUploadAsset(session.publicId, session.cleanupResourceType, session.cleanupDeliveryType);
        await repository.markCleanupComplete(session.publicId, session.cleanupResourceType, session.cleanupDeliveryType);
      } catch {
        console.error("Limpeza de upload será tentada novamente", { uploadId: session.id });
      }
    }
  } catch {
    console.error("Não foi possível consultar a fila de limpeza de uploads");
  } finally { running = false; }
}

export function startDirectUploadCleanup() {
  // Metadata-only requests, bounded batches; expired images and failed deletions are retried.
  const timer = setInterval(() => { void cleanupDirectUploads(); }, 60_000);
  timer.unref();
  return timer;
}
