import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  GET_NOTIFICATIONS_BY_USER,
  UPDATE_NOTIFICATION_STATUS,
} from "./notification.queries";

export type NotificationMetadata = {
  projectId?: number;
  projectTitle?: string;
  inviterId?: number;
  inviterName?: string;
  inviteeId?: number;
  status?: "pending" | "accepted" | "declined";
  respondedAt?: string;
  [key: string]: unknown;
};

export type Notification = {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  metadata?: NotificationMetadata | null;
};

type GqlNotification = {
  id: number;
  message?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  read_at?: string | null;
  metadata?: NotificationMetadata | null;
};

const mapNotification = (notification?: GqlNotification | null): Notification => {
  if (!notification) throw new Error("Notification payload missing.");
  return {
    id: notification.id,
    message: notification.message ?? "",
    type: notification.type ?? "info",
    is_read: Boolean(notification.is_read),
    created_at: notification.created_at ?? "",
    updated_at: notification.updated_at ?? "",
    read_at: notification.read_at ?? null,
    metadata: notification.metadata ?? null,
  };
};

export async function fetchNotificationsForUser(
  userId: number,
): Promise<Notification[]> {
  try {
    const numericId = Number(userId);
    const { data } = await apolloClient.query<{
      notificationsByUser?: GqlNotification[];
    }>({
      query: GET_NOTIFICATIONS_BY_USER,
      variables: { userId: numericId },
      fetchPolicy: "network-only",
    });
    return (data?.notificationsByUser ?? []).map((notification) =>
      mapNotification(notification),
    );
  } catch (error) {
    throw formatGraphQLError("Fetch notifications", error);
  }
}

export async function markNotificationRead(
  notificationId: number,
  isRead: boolean,
): Promise<Notification> {
  try {
    const numericId = Number(notificationId);
    const { data } = await apolloClient.mutate<{
      updateNotificationStatus?: GqlNotification;
    }>({
      mutation: UPDATE_NOTIFICATION_STATUS,
      variables: {
        id: numericId,
        input: { is_read: Boolean(isRead) },
      },
    });
    const updated = data?.updateNotificationStatus;
    if (!updated) throw new Error("Unable to update notification.");
    return mapNotification(updated);
  } catch (error) {
    throw formatGraphQLError("Update notification", error);
  }
}
