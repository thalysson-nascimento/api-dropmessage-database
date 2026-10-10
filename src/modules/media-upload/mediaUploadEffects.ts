import { prismaCliente } from "../../database/prismaCliente";
import { getSocketIO } from "../../lib/socket";
import { serializePrivateMessage } from "../send-message/privateMessageSerializer";

let running = false;
export async function processMediaEffects(sessionId?: string) {
  if (running && !sessionId) return;
  if (!sessionId) running = true;
  try {
    const jobs = await prismaCliente.mediaUploadEffect.findMany({ where: { done: false, nextAttemptAt: { lte: new Date() }, ...(sessionId ? { sessionId } : {}) }, take: 20 });
    for (const job of jobs) {
      const payload = job.payload as any;
      try {
        if (job.kind === "PRIVATE_EVENT") {
          // At-most-one event attempt; HTTP history/status recover a process crash or lost socket.
          const claim = await prismaCliente.mediaUploadEffect.updateMany({ where: { id: job.id, done: false }, data: { done: true } });
          if (!claim.count) continue;
          const message = await prismaCliente.message.findUnique({ where: { id: payload.messageId }, include: {
            user: { select: { userHashPublic: true, name: true, avatar: true } }, match: { include: { initiator: { select: { isDeactivated: true } }, recipient: { select: { isDeactivated: true } } } },
          } });
          if (message && !message.match.unMatch && !message.match.initiator.isDeactivated && !message.match.recipient.isDeactivated) {
            try { getSocketIO().to(message.matchId).emit("send-message", { ...serializePrivateMessage(message), uploadId: job.sessionId }); }
            catch { /* Client recovers from authenticated history/status. */ }
          }
          try { const { client } = await import("../../lib/redis"); await client.del(`messages:${payload.matchId}:${payload.userId}:0:10`); } catch { /* Cache is auxiliary. */ }
          continue;
        }
        if (job.kind === "TIMELINE_CACHE") {
          const post = await prismaCliente.postMessageCloudinary.findUnique({ where: { id: payload.postId } });
          if (post && !post.isExpired) {
            const ttl = Math.ceil((post.expirationTimer.getTime() - Date.now()) / 1000);
            if (ttl > 0) { const { client } = await import("../../lib/redis"); await client.setEx(`post:${post.id}`, ttl, JSON.stringify(payload.post)); }
          }
        }
        if (job.kind === "TRIAL") {
          const user = await prismaCliente.user.findFirst({ where: { id: payload.userId, isDeactivated: false }, select: { id: true } });
          if (user) {
            const { default: stripe } = await import("../../config/stripe.config");
            let found = false;
            let cursor: string | undefined;
            do {
              const page = await stripe.subscriptions.list({ customer: payload.customerId, status: "all", limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
              found = page.data.some(s => s.metadata.directMediaTrial === payload.userId);
              cursor = !found && page.has_more ? page.data[page.data.length - 1]?.id : undefined;
            } while (cursor);
            if (!found) await stripe.subscriptions.create({ customer: payload.customerId, items: [{ price: payload.priceId }],
              coupon: "free_trial_7_days", trial_period_days: 7, payment_behavior: "default_incomplete",
              trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
              metadata: { userId: payload.userId, priceId: payload.priceId, directMediaTrial: payload.userId },
            }, { idempotencyKey: `direct-media-trial:${payload.userId}` });
          }
        }
        await prismaCliente.mediaUploadEffect.update({ where: { id: job.id }, data: { done: true } });
      } catch {
        await prismaCliente.mediaUploadEffect.updateMany({ where: { id: job.id, done: false }, data: {
          attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + Math.min(3600_000, 60_000 * 2 ** Math.min(job.attempts, 6))),
        } });
        console.error("Efeito de mídia será repetido", { effectId: job.id, kind: job.kind });
      }
    }
  } finally { if (!sessionId) running = false; }
}
