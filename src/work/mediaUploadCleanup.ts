import { prismaCliente } from "../database/prismaCliente";
import { queueMediaCleanup } from "../modules/media-upload/mediaDomainPublisher";
import { deleteDirectUploadAsset } from "../service/cloudinaryDirectUpload.service";
import { processMediaEffects } from "../modules/media-upload/mediaUploadEffects";

let running = false;
export async function cleanupMediaUploads() {
  if (running) return;
  running = true;
  try {
    const expired = await prismaCliente.directUploadSession.findMany({ where: { purpose: { startsWith: "MEDIA:" }, status: "PENDING",
      expiresAt: { lt: new Date(Date.now() - 20 * 60_000) } }, take: 20, include: { assets: true } });
    const gone = await prismaCliente.$queryRaw<{ id: string }[]>`SELECT s.id FROM "direct-upload-session" s
      LEFT JOIN "PostMessageCloudinary" p ON p.id=s."resourceId"
      WHERE s.purpose='MEDIA:timeline' AND s.status='PUBLISHED'
      AND (p.id IS NULL OR p."isExpired" OR p."expirationTimer" <= NOW()) LIMIT 20`;
    for (const id of [...expired.map(s => s.id), ...gone.map(s => s.id)]) {
      await prismaCliente.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "direct-upload-session" WHERE id=${id} FOR UPDATE`;
        const session = await tx.directUploadSession.findUnique({ where: { id }, include: { assets: true } });
        if (!session || !["PENDING", "PUBLISHED"].includes(session.status)) return;
        for (const asset of session.assets) await queueMediaCleanup(tx, asset.publicId);
        await tx.directUploadSession.update({ where: { id }, data: { status: "EXPIRED", rejectionReason: "UPLOAD_EXPIRED" } });
      });
    }
    const jobs = await prismaCliente.mediaCleanupTask.findMany({ where: { pending: true }, orderBy: { updatedAt: "asc" }, take: 20 });
    for (const job of jobs) {
      try {
        await deleteDirectUploadAsset(job.publicId, job.resourceType, job.deliveryType);
        await prismaCliente.mediaCleanupTask.updateMany({ where: { id: job.id, updatedAt: job.updatedAt }, data: { pending: false } });
      } catch {
        await prismaCliente.mediaCleanupTask.updateMany({ where: { id: job.id, updatedAt: job.updatedAt }, data: { updatedAt: new Date() } });
        console.error("Limpeza de mídia será repetida", { cleanupId: job.id });
      }
    }
    await processMediaEffects();
  } catch { console.error("Falha ao processar tarefas de mídias diretas"); }
  finally { running = false; }
}
