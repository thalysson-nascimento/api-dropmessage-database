import { getImageUrl, getAvatarThumbnailUrl } from "../../service/cloudinary.service";

export function serializePrivateMessage(message: {
  id: string;
  mediaUploadId?: string | null;
  matchId: string;
  createdAt: Date;
  content: string | null;
  image: string | null;
  fileName: string | null;
  viewOnce: boolean;
  views?: { userId: string }[];
  user: {
    userHashPublic: string;
    name: string;
    avatar: { image: string; version: number | null; thumbnail?: string | null; thumbnailVersion?: number | null } | null;
  };
}) {
  return {
    id: message.id,
    ...(message.mediaUploadId ? { uploadId: message.mediaUploadId } : {}),
    matchId: message.matchId,
    createdAt: message.createdAt,
    content: message.content,
    imageUrl:
      message.image && !message.viewOnce ? getImageUrl(message.image) : null,
    fileName: message.viewOnce ? null : message.fileName,
    viewOnce: message.viewOnce,
    viewOnceStatus: message.viewOnce ? message.views?.length ? "READ" : "PENDING" : null,
    user: {
      userHashPublic: message.user.userHashPublic,
      name: message.user.name,
      avatarThumbnailUrl: getAvatarThumbnailUrl(message.user.avatar),
      avatar: message.user.avatar?.image
        ? getImageUrl(
            message.user.avatar.image,
            message.user.avatar.version ?? undefined,
          )
        : null,
    },
  };
}
