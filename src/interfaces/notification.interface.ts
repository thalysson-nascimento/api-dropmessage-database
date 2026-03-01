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

export interface NotificationModel {
  id: string;
  type: NotificationTypeEnum;
  actors: NotificationActor[];
  target: NotificationTarget | null;
  createdAt: string;
  isRead: boolean;
}
