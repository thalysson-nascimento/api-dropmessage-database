import { Prisma, DirectUploadSession, DirectUploadAsset } from "@prisma/client";
import { mediaError, MediaIntent } from "./mediaUploadContract";
import { buildExpirationData, ExpirationTimer } from "../post-message-cloudinary/create-post-message-cloudinary/useCase/domain/expiration.config";

export async function queueMediaCleanup(tx: Prisma.TransactionClient, publicId: string, resourceType = "image", deliveryType = "authenticated") {
  await tx.mediaCleanupTask.upsert({ where: { publicId_resourceType_deliveryType: { publicId, resourceType, deliveryType } },
    create: { publicId, resourceType, deliveryType }, update: { pending: true } });
}

export async function checkMediaPermission(tx: Prisma.TransactionClient, userId: string, domain: string, metadata: any) {
  if (domain === "private-chat") {
    // Match first, then participant rows: consistent ordering avoids paired-sender deadlocks.
    await tx.$queryRaw`SELECT id FROM "match" WHERE id = ${metadata.matchId} FOR UPDATE`;
    const match = await tx.match.findUnique({ where: { id: metadata.matchId } });
    if (!match || match.unMatch) throw mediaError(404, "MATCH_UNAVAILABLE", "Match não disponível");
    if (match.initiatorId !== userId && match.recipientId !== userId)
      throw mediaError(403, "MATCH_FORBIDDEN", "Você não participa desse match");
    await tx.$queryRaw`SELECT id FROM "user" WHERE id IN (${match.initiatorId}, ${match.recipientId}) ORDER BY id FOR SHARE`;
    const active = await tx.user.count({ where: { id: { in: [match.initiatorId, match.recipientId] }, isDeactivated: false } });
    if (active !== 2) throw mediaError(404, "MATCH_UNAVAILABLE", "Participante indisponível");
  } else {
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`;
  }
  const user = await tx.user.findFirst({ where: { id: userId, isDeactivated: false }, select: { id: true, avatarUploadRevision: true } });
  if (!user) throw mediaError(403, "USER_UNAVAILABLE", "Conta indisponível");
  if (domain === "avatar" && await tx.avatarCloudinary.findUnique({ where: { userId } }))
    throw mediaError(409, "AVATAR_EXISTS", "Avatar já cadastrado; use avatar-update");
  // All four existing timeline durations remain available for every plan.
  return user;
}

export async function publishMediaDomain(tx: Prisma.TransactionClient, session: DirectUploadSession, assets: DirectUploadAsset[]) {
  const domain = session.purpose.slice(6);
  const metadata = session.metadata as any;
  const user = await checkMediaPermission(tx, session.userId, domain, metadata);
  const image = assets.find(a => a.role === "image")!;
  if (domain === "avatar" || domain === "avatar-update") {
    if (user.avatarUploadRevision !== session.avatarRevision)
      throw mediaError(409, "AVATAR_SUPERSEDED", "Existe uma intenção de avatar mais recente");
    const thumbnail = assets.find(a => a.role === "thumbnail")!;
    const old = await tx.avatarCloudinary.findUnique({ where: { userId: session.userId } });
    const data = { image: image.publicId, version: image.version, format: image.format!, fileName: image.fileName,
      optimizedSize: image.bytes!, thumbnail: thumbnail.publicId, thumbnailVersion: thumbnail.version };
    const avatar = domain === "avatar"
      ? await tx.avatarCloudinary.create({ data: { ...data, userId: session.userId } })
      : await tx.avatarCloudinary.upsert({ where: { userId: session.userId }, create: { ...data, userId: session.userId }, update: data });
    if (domain === "avatar") await tx.aboutMe.upsert({ where: { userId: session.userId },
      create: { ...metadata, userId: session.userId }, update: metadata });
    await tx.user.update({ where: { id: session.userId }, data: { isUploadAvatar: true } });
    if (old) {
      await queueMediaCleanup(tx, old.image);
      if (old.thumbnail) await queueMediaCleanup(tx, old.thumbnail);
    }
    return { resourceId: avatar.id, result: {} as Prisma.InputJsonObject };
  }
  if (domain === "private-chat") {
    const message = await tx.message.create({ data: { userId: session.userId, matchId: metadata.matchId, image: image.publicId,
      fileName: image.fileName, format: image.format, viewOnce: metadata.viewOnce, mediaUploadId: session.id } });
    await tx.mediaUploadEffect.create({ data: { sessionId: session.id, kind: "PRIVATE_EVENT", payload: { messageId: message.id, matchId: message.matchId, userId: session.userId } } });
    return { resourceId: message.id, result: {} as Prisma.InputJsonObject };
  }
  const expiration = buildExpirationData(metadata.expirationTimer as ExpirationTimer);
  const post = await tx.postMessageCloudinary.create({ data: { userId: session.userId, image: image.publicId,
    fileName: image.fileName, format: image.format!, optimizedSize: image.bytes!,
    typeExpirationTimer: metadata.expirationTimer, expirationTimer: expiration.expirationDate } });
  const subscription = await tx.stripeSignature.findFirst({ where: { userId: session.userId, status: { in: ["active", "trialing"] } } });
  const result: Record<string, Prisma.InputJsonValue | null> = { ...JSON.parse(JSON.stringify(expiration)), expirationTimer: metadata.expirationTimer, sharedPostSuccess: true };
  if (!subscription) {
    const admin = await tx.adminActivePlanGoldFreeTrial.findFirst({ where: { activePlan: true } });
    const used = await tx.subscriptionGoldFreeTrial.findUnique({ where: { userId: session.userId } });
    if (admin && !used) {
      await tx.subscriptionGoldFreeTrial.create({ data: { userId: session.userId } });
      await tx.viewCardOrFirstPublicationPlanGoldFreeTrial.upsert({ where: { userId: session.userId },
        create: { userId: session.userId, firstPublicationPostMessage: true }, update: { firstPublicationPostMessage: true } });
      result.planGoldFreeTrialCongratulations = true;
      delete result.sharedPostSuccess;
      const customer = await tx.userStripeCustomersId.findUnique({ where: { userId: session.userId } });
      if (customer) {
        if (!process.env.PRICEID_GOLD_FREE_TRIAL) throw mediaError(503, "TRIAL_NOT_CONFIGURED", "Plano de teste não configurado");
        await tx.mediaUploadEffect.create({ data: { sessionId: session.id, kind: "TRIAL", payload: {
          userId: session.userId, customerId: customer.customerId, priceId: process.env.PRICEID_GOLD_FREE_TRIAL,
        } } });
      }
    } else result.showADS = true;
  }
  await tx.mediaUploadEffect.create({ data: { sessionId: session.id, kind: "TIMELINE_CACHE", payload: {
    postId: post.id, userId: session.userId, expiresAt: expiration.expirationDate.toISOString(), post: result,
  } } });
  return { resourceId: post.id, result };
}
