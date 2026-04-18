import { NotificationTypeEnum } from "../enums/notification.enum";

export interface NotificationActor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface NotificationTarget {
  id: string;
  type: "photo" | "video" | "match" | "message";
  thumbnailUrl: string | null;
}

export interface NotificationActionMeta {
  commentText?: string;
  totalCount?: number;
  isFollowing?: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationTypeEnum;
  subscription: boolean;
  actors: NotificationActor[];
  target: NotificationTarget | null;
  meta?: NotificationActionMeta; // ✅ voltou
  match: boolean; // ✅ NOVO
  createdAt: string;
  isRead: boolean;
}

export interface GetNotificationResponse {
  subscription: boolean;
  items: NotificationItem[];
}
